import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { logger, loggerStream } from '../utils/logger';

// Custom Morgan token for request body (be careful with sensitive data)
morgan.token('body', (req: Request) => {
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitized = { ...req.body };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    return JSON.stringify(sanitized);
  }
  return '-';
});

// Morgan middleware with custom format
export const requestLogger = morgan(
  ':method :url :status :response-time ms - :body',
  { stream: loggerStream }
);

// Additional detailed request logger
export const detailedRequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};
