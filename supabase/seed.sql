-- Seed sample topics and concepts

-- Mathematics Topics
INSERT INTO public.topics (id, name, description, subject, difficulty_range) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Algebra Fundamentals', 'Basic algebraic concepts and operations', 'Mathematics', '{1,5}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Quadratic Equations', 'Understanding and solving quadratic equations', 'Mathematics', '{4,8}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Linear Equations', 'Solving linear equations and systems', 'Mathematics', '{2,6}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Geometry Basics', 'Fundamental geometric concepts', 'Mathematics', '{1,5}'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Trigonometry', 'Trigonometric functions and identities', 'Mathematics', '{5,9}');

-- Algebra Fundamentals Concepts
INSERT INTO public.concepts (topic_id, name, description, difficulty) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Variables and Expressions', 'Understanding variables and algebraic expressions', 2),
  ('550e8400-e29b-41d4-a716-446655440001', 'Order of Operations', 'PEMDAS and evaluation order', 1),
  ('550e8400-e29b-41d4-a716-446655440001', 'Combining Like Terms', 'Simplifying expressions by combining terms', 3),
  ('550e8400-e29b-41d4-a716-446655440001', 'Distributive Property', 'Applying the distributive property', 3);

-- Quadratic Equations Concepts
INSERT INTO public.concepts (topic_id, name, description, difficulty) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Standard Form', 'Understanding ax² + bx + c = 0', 4),
  ('550e8400-e29b-41d4-a716-446655440002', 'Discriminant', 'Using b² - 4ac to determine root nature', 5),
  ('550e8400-e29b-41d4-a716-446655440002', 'Quadratic Formula', 'Solving using the quadratic formula', 6),
  ('550e8400-e29b-41d4-a716-446655440002', 'Factoring', 'Factoring quadratic expressions', 5),
  ('550e8400-e29b-41d4-a716-446655440002', 'Completing the Square', 'Solving by completing the square', 7),
  ('550e8400-e29b-41d4-a716-446655440002', 'Vertex Form', 'Understanding a(x-h)² + k form', 6);

-- Linear Equations Concepts
INSERT INTO public.concepts (topic_id, name, description, difficulty) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Slope-Intercept Form', 'Understanding y = mx + b', 3),
  ('550e8400-e29b-41d4-a716-446655440003', 'Point-Slope Form', 'Using point-slope form', 4),
  ('550e8400-e29b-41d4-a716-446655440003', 'Systems of Equations', 'Solving systems of linear equations', 5),
  ('550e8400-e29b-41d4-a716-446655440003', 'Graphing Lines', 'Graphing linear equations', 3);

-- Geometry Basics Concepts
INSERT INTO public.concepts (topic_id, name, description, difficulty) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'Angles', 'Types and properties of angles', 2),
  ('550e8400-e29b-41d4-a716-446655440004', 'Triangles', 'Triangle properties and theorems', 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'Circles', 'Circle properties and formulas', 4),
  ('550e8400-e29b-41d4-a716-446655440004', 'Area and Perimeter', 'Calculating area and perimeter', 2);

-- Trigonometry Concepts
INSERT INTO public.concepts (topic_id, name, description, difficulty) VALUES
  ('550e8400-e29b-41d4-a716-446655440005', 'Sine and Cosine', 'Understanding sin and cos functions', 5),
  ('550e8400-e29b-41d4-a716-446655440005', 'Tangent', 'Understanding tangent function', 5),
  ('550e8400-e29b-41d4-a716-446655440005', 'Unit Circle', 'Understanding the unit circle', 6),
  ('550e8400-e29b-41d4-a716-446655440005', 'Trigonometric Identities', 'Key trig identities', 8),
  ('550e8400-e29b-41d4-a716-446655440005', 'Law of Sines', 'Applying law of sines', 7),
  ('550e8400-e29b-41d4-a716-446655440005', 'Law of Cosines', 'Applying law of cosines', 7);

-- Sample Achievements
INSERT INTO public.achievements (name, description, badge_icon, xp_reward, criteria) VALUES
  ('First Steps', 'Complete your first learning session', '🎯', 50, '{"type": "session_count", "value": 1}'),
  ('Week Warrior', 'Maintain a 7-day streak', '🔥', 100, '{"type": "streak", "value": 7}'),
  ('Perfect Session', 'Complete a session with 100% understanding', '⭐', 75, '{"type": "perfect_session", "value": 1}'),
  ('Quick Learner', 'Master 10 concepts', '🚀', 150, '{"type": "concepts_mastered", "value": 10}'),
  ('Dedicated Student', 'Complete 50 learning sessions', '📚', 250, '{"type": "session_count", "value": 50}'),
  ('Master Mind', 'Reach level 10', '🧠', 500, '{"type": "level", "value": 10}'),
  ('Consistency King', 'Maintain a 30-day streak', '👑', 300, '{"type": "streak", "value": 30}');
