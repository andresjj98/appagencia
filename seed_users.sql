INSERT INTO users
  (name, last_name, id_card, username, email, role, password, active, avatar)
VALUES
  ('Juan',  'Pérez',  'ID123456', 'admin',    'admin@demo.com',   'admin',   '$2b$10$BLrUrMQUsaoIWSPW53vOwO33KRTnLmHqEJwU9o9gqltehRtQEoeRC', 1, NULL),
  ('Ana',   'García', 'ID234567', 'asesor',   'asesor@demo.com',  'advisor', '$2b$10$3AoGAwGNXR8DMlz92ByZr.S5VL6j0sdxoYTGseLx91uxPzkEUxx7a', 1, NULL),
  ('Carlos','López',  'ID345678', 'operario', 'operario@demo.com','manager', '$2b$10$8X9BeHMHZUTCa7vLmw6ZAeqoEVSFaDVXp0/RSD7e61lOodBbvVUlC', 1, NULL);