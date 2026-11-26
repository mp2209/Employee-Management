-- =============================================================================
-- UDPT — Seed an admin (Manager) and an employee (Employee) account for local
-- login testing.
-- =============================================================================
-- Usage:
--   mysql -u root -p < server/sql/seed_admin.sql
--
-- Default credentials:
--   username: admin     password: admin123     role: Manager
--   username: employee  password: employee123  role: Employee
--
-- The password hashes below are BCrypt (cost 10) hashes generated with the
-- same BCryptPasswordEncoder that Spring Security uses. Login through the
-- gateway (POST /api/users/login) will succeed with these credentials.
--
-- If you change the passwords, regenerate the hashes — see server/sql/README.md
-- =============================================================================

-- Create the user-service database if it does not exist yet.
-- (Spring's `ddl-auto=update` will create tables, but not the database itself.)
CREATE DATABASE IF NOT EXISTS ProfileService
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE ProfileService;

-- ---------------------------------------------------------------------------
-- Manager account
-- ---------------------------------------------------------------------------
INSERT INTO `user` (username, password, role, status)
VALUES (
    'admin',
    '$2a$10$AnBzv8It5elBfAcOr/5u6uOaz83DYxd68IQasbwHC7AFjhOJCX37.',  -- admin123
    'Manager',
    'Active'
)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    role     = VALUES(role),
    status   = VALUES(status);

-- Optional: link an Employee record to the manager so profile/points features
-- work for the admin user. Safe to skip if you only need login.
INSERT INTO employee (identify_id, name, birth_date, gender, status, user_id)
SELECT 'ADMIN001', 'System Admin', '1990-01-01', 'Other', 'Active', u.id
FROM `user` u
WHERE u.username = 'admin'
  AND NOT EXISTS (
      SELECT 1 FROM employee e WHERE e.user_id = u.id
  );

-- ---------------------------------------------------------------------------
-- Employee account
-- ---------------------------------------------------------------------------
INSERT INTO `user` (username, password, role, status)
VALUES (
    'employee',
    '$2a$10$6P6YvzHbtMzUWWSBzaWdvuWZEXa4N38iym0c8JSKyy60QASFMmeOy',  -- employee123
    'Employee',
    'Active'
)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    role     = VALUES(role),
    status   = VALUES(status);

INSERT INTO employee (identify_id, name, birth_date, gender, status, user_id)
SELECT 'EMP0001', 'Test Employee', '1995-05-05', 'Male', 'Active', u.id
FROM `user` u
WHERE u.username = 'employee'
  AND NOT EXISTS (
      SELECT 1 FROM employee e WHERE e.user_id = u.id
  );
