DROP DATABASE IF EXISTS educat;
CREATE DATABASE educat;
USE educat;

SET FOREIGN_KEY_CHECKS = 0; -- Prevents errors when dropping/creating

-- ==========================================
-- LEVEL 1: CORE TABLES
-- ==========================================

CREATE TABLE roles (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE subjects (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- ==========================================
-- LEVEL 2: USERS & ROLES
-- ==========================================

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    password VARCHAR(200) NOT NULL,
    role_id INT NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL,
    address VARCHAR(150) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    join_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    picture VARCHAR(300),
    2fa_enabled BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ==========================================
-- LEVEL 3: SPECIFIC USER PROFILES
-- ==========================================

CREATE TABLE teachers (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    user_code VARCHAR(20) UNIQUE, -- 🌟 FIXED: Required by register.js
    highest_qualification VARCHAR(200),
    university VARCHAR(200),
    experience_years INT,
    bio TEXT,
    resume_link VARCHAR(300),
    nic_path VARCHAR(300),
    verification_status VARCHAR(20) DEFAULT 'pending', 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE students (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    user_code VARCHAR(20) UNIQUE, -- 🌟 FIXED: Required by register.js
    grade_level VARCHAR(50),
    school_name VARCHAR(150),
    guardian_name VARCHAR(150),
    guardian_phone VARCHAR(15),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE admins (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    admin_level VARCHAR(50) DEFAULT 'standard',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_activity (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_type VARCHAR(200) NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE todos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATE DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- LEVEL 4: COURSES & CONTENT
-- ==========================================

CREATE TABLE classes_courses (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    t_id INT NOT NULL, 
    students INT DEFAULT 0,            -- 🌟 FIXED: Required by courses.js
    modules INT DEFAULT 0,             -- 🌟 FIXED: Required by courses.js
    progress INT DEFAULT 0,            -- 🌟 FIXED: Required by courses.js
    status VARCHAR(20) DEFAULT 'not_active',
    is_published BOOLEAN DEFAULT FALSE,
    theme_color VARCHAR(20) DEFAULT 'purple', 
    thumbnail_url VARCHAR(300), 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(t_id) REFERENCES teachers(id)
);

CREATE TABLE promo_codes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    c_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    discount_percent DECIMAL(5,3) NOT NULL,
    expire_date DATE NOT NULL,
    FOREIGN KEY(c_id) REFERENCES classes_courses(id)
);

CREATE TABLE modules (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    number INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    isVisible TINYINT(1) DEFAULT 1,    -- 🌟 FIXED: Required for Hide/Show UI
    c_id INT NOT NULL,
    FOREIGN KEY(c_id) REFERENCES classes_courses(id)
);

CREATE TABLE timetables (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    c_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    meeting_link VARCHAR(300),
    status VARCHAR(20) DEFAULT 'scheduled',
    FOREIGN KEY (c_id) REFERENCES classes_courses(id) ON DELETE CASCADE
);

-- ==========================================
-- LEVEL 5: MODULE ASSETS & ASSESSMENTS
-- ==========================================

CREATE TABLE lessons (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    number DECIMAL(4,2) NOT NULL,
    title VARCHAR(150) DEFAULT '',     -- 🌟 FIXED: Required by courses.js
    isVisible TINYINT(1) DEFAULT 1,    -- 🌟 FIXED: Required for Hide/Show UI
    type VARCHAR(20) NOT NULL,
    link VARCHAR(300) NOT NULL,
    m_id INT NOT NULL,
    FOREIGN KEY(m_id) REFERENCES modules(id)
);

CREATE TABLE resources (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    link VARCHAR(300) NOT NULL,
    number INT NOT NULL,
    isVisible TINYINT(1) DEFAULT 1,    -- 🌟 FIXED
    m_id INT NOT NULL,
    l_id INT,                          -- 🌟 FIXED: Links resources to specific lessons
    FOREIGN KEY(m_id) REFERENCES modules(id),
    FOREIGN KEY(l_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- 🌟 RESTORED MISSING ASSIGNMENT TABLES
CREATE TABLE assignments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    m_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline DATETIME NOT NULL,
    max_marks DECIMAL(5,2) DEFAULT 100.00,
    publish_at DATETIME DEFAULT NULL,
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(m_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE assignment_attachments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    a_id INT NOT NULL,
    file_url VARCHAR(300) NOT NULL,
    FOREIGN KEY(a_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE TABLE assignment_submissions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    a_id INT NOT NULL,
    s_id INT NOT NULL,
    file_url VARCHAR(300) NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    grade DECIMAL(5,2),
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'submitted',
    FOREIGN KEY(a_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY(s_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE quizes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    number INT NOT NULL,
    time_limit TIME NOT NULL,
    is_peer_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    m_id INT NOT NULL,
    FOREIGN KEY(m_id) REFERENCES modules(id)
);

CREATE TABLE question_bank (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    marks DECIMAL(4,2) NOT NULL,
    question VARCHAR(1000) NOT NULL,
    c_id INT NOT NULL,
    t_id INT NOT NULL,
    FOREIGN KEY(c_id) REFERENCES classes_courses(id),
    FOREIGN KEY(t_id) REFERENCES teachers(id)
);

CREATE TABLE answers (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    answer VARCHAR(400) NOT NULL,
    correct BOOLEAN DEFAULT FALSE,
    q_id INT NOT NULL,
    FOREIGN KEY(q_id) REFERENCES question_bank(id) ON DELETE CASCADE
);

CREATE TABLE quiz_questions (
    qz_id INT NOT NULL,
    q_id INT NOT NULL,
    PRIMARY KEY (qz_id, q_id),
    FOREIGN KEY(qz_id) REFERENCES quizes(id) ON DELETE CASCADE,
    FOREIGN KEY(q_id) REFERENCES question_bank(id) ON DELETE CASCADE
);

CREATE TABLE quiz_submissions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    qz_id INT NOT NULL,
    s_id INT NOT NULL,
    score DECIMAL(5,2),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(qz_id) REFERENCES quizes(id) ON DELETE CASCADE,
    FOREIGN KEY(s_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE student_quiz_answers (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    q_id INT NOT NULL,
    a_id INT NOT NULL,
    FOREIGN KEY(submission_id) REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY(q_id) REFERENCES question_bank(id) ON DELETE CASCADE,
    FOREIGN KEY(a_id) REFERENCES answers(id) ON DELETE CASCADE
);

-- ==========================================
-- LEVEL 6: CONNECTIONS & TRANSACTIONS
-- ==========================================

CREATE TABLE payments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    invoice_link VARCHAR(200) NOT NULL,
    amount DECIMAL(6,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    c_id INT NOT NULL,
    s_id INT NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY(c_id) REFERENCES classes_courses(id),
    FOREIGN KEY(s_id) REFERENCES students(id)
);

CREATE TABLE notifications (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    user_id INT NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500) NOT NULL,
    rating DECIMAL(2,1) NOT NULL DEFAULT 5.0, 
    c_id INT NOT NULL,
    s_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(s_id) REFERENCES students(id),
    FOREIGN KEY(c_id) REFERENCES classes_courses(id)
);

-- ==========================================
-- LEVEL 7: STATUS & PROGRESS TRACKING
-- ==========================================

CREATE TABLE enrollments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    s_id INT NOT NULL,
    c_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'In Progress', 
    enrolled_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(s_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(c_id) REFERENCES classes_courses(id) ON DELETE CASCADE
);

CREATE TABLE lesson_completions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    s_id INT NOT NULL,
    l_id INT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(s_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(l_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE teacher_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE TABLE teacher_subjects (
    t_id INT NOT NULL,
    sub_id INT NOT NULL,
    PRIMARY KEY (t_id, sub_id),
    FOREIGN KEY (t_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (sub_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 🌟 RESTORED MISSING ESCALATIONS TABLE
CREATE TABLE admin_escalations (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    sub_admin_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL, 
    entity_id INT NOT NULL,           
    reason TEXT NOT NULL,             
    status VARCHAR(20) DEFAULT 'pending', 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sub_admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 🌟 RESTORED: COMMUNICATION & CHAT SYSTEM
-- ==========================================

CREATE TABLE conversations (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    participant1_id INT NOT NULL,
    participant2_id INT NOT NULL,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_chat (participant1_id, participant2_id) 
);

CREATE TABLE messages (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 🌟 DATABASE INDEXES (FOR SPEED & PERFORMANCE)
-- ==========================================
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_teacher_verification ON teachers(verification_status);
CREATE INDEX idx_student_code ON students(user_code);
CREATE INDEX idx_teacher_code ON teachers(user_code);
CREATE INDEX idx_enrollment_lookup ON enrollments(s_id, c_id, status);

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- SEED DATA
-- ==========================================
INSERT INTO roles (role_name) VALUES ('admin'), ('teacher'), ('student');

INSERT INTO subjects (name) VALUES 
('Web Development'), ('Data Science'), ('UI/UX Design'), ('Mathematics'), ('Languages'), ('A/L Physics'), ('A/L Chemistry');

-- Add a default admin account
INSERT INTO users(name, password, role_id, email, phone_number, address, dob, gender, status, join_date, picture) 
VALUES ('Super Admin', '$2b$10$ZemIIkWGaWhDaNFgHiXGyOEmzj2qoHzjNCoWNgNFBha9LfHhTPPJS', 1, 'admin.user@example.com', '077777777', 'Kandy', '2000-02-01', 'male', 'active', CURDATE(), 'default_admin.png');

INSERT INTO admins(user_id, admin_level) VALUES (1, 'super');