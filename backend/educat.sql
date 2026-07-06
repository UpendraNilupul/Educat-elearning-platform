DROP DATABASE IF EXISTS educat;
CREATE DATABASE educat;
USE educat;

-- Turn on the Event Scheduler for the 7-day auto-delete message feature
SET GLOBAL event_scheduler = ON;
SET FOREIGN_KEY_CHECKS = 0; -- Temporarily disable checks during full schema generation

-- ==========================================
-- LEVEL 1: CORE LOOKUP TABLES (No Dependencies)
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
-- LEVEL 2: IDENTITY AND AUTHENTICATION
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

CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- LEVEL 3: USER PROFILE SPECIFICATIONS & UTILITIES
-- ==========================================

CREATE TABLE teachers (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    user_code VARCHAR(20) UNIQUE,
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
    user_code VARCHAR(20) UNIQUE,
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
-- LEVEL 4: PLATFORM ACADEMICS & CONTENT ENTITIES
-- ==========================================

CREATE TABLE advertisements (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    t_id INT DEFAULT NULL,
    ad_link VARCHAR(300),
    is_published BOOLEAN DEFAULT FALSE,
    FOREIGN KEY(t_id) REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE TABLE classes_courses (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    t_id INT NOT NULL, 
    teacher_id INT DEFAULT 1,          
    students INT DEFAULT 0,            
    modules INT DEFAULT 0,             
    progress INT DEFAULT 0,            
    monthly_fee DECIMAL(10,2) DEFAULT 0, 
    schedule_text VARCHAR(255) DEFAULT NULL, 
    status VARCHAR(20) DEFAULT 'not_active',
    is_published BOOLEAN DEFAULT FALSE,
    theme_color VARCHAR(20) DEFAULT 'purple', 
    thumbnail_url VARCHAR(300), 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(t_id) REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE TABLE promo_codes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    c_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    discount_percent DECIMAL(5,3) NOT NULL,
    expire_date DATE NOT NULL,
    FOREIGN KEY(c_id) REFERENCES classes_courses(id) ON DELETE CASCADE
);

CREATE TABLE modules (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    number INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    isVisible TINYINT(1) DEFAULT 1,    
    c_id INT NOT NULL,
    FOREIGN KEY(c_id) REFERENCES classes_courses(id) ON DELETE CASCADE
);

CREATE TABLE live_classes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    c_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    meeting_link VARCHAR(300) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (c_id) REFERENCES classes_courses(id) ON DELETE CASCADE
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
-- LEVEL 5: FINANCIAL RECORDS
-- ==========================================


-- ==========================================
-- LEVEL 6: ASSETS, CURRICULUM, AND ASSESSMENTS
-- ==========================================

CREATE TABLE lessons (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    number DECIMAL(4,2) NOT NULL,
    title VARCHAR(150) DEFAULT '',     
    isVisible TINYINT(1) DEFAULT 1,    
    type VARCHAR(20) NOT NULL,
    link VARCHAR(300) NOT NULL,
    m_id INT NOT NULL,
    FOREIGN KEY(m_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE resources (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    link VARCHAR(300) NOT NULL,
    number INT NOT NULL,
    isVisible TINYINT(1) DEFAULT 1,    
    type VARCHAR(50) DEFAULT 'pdf',    
    m_id INT NOT NULL,
    l_id INT,                          
    FOREIGN KEY(m_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY(l_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE assignments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    m_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    attachment_url VARCHAR(300),       
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
    title VARCHAR(200) DEFAULT NULL,
    number INT NOT NULL,
    time_limit TIME NOT NULL,
    is_peer_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    m_id INT NOT NULL,
    publish_at DATETIME DEFAULT NULL,        
    notification_sent BOOLEAN DEFAULT FALSE,
    allow_review BOOLEAN DEFAULT TRUE,
    FOREIGN KEY(m_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE question_bank (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    marks DECIMAL(5,2) NOT NULL,
    question VARCHAR(1000) NOT NULL,
    c_id INT NOT NULL,
    t_id INT NOT NULL,
    FOREIGN KEY(c_id) REFERENCES classes_courses(id) ON DELETE CASCADE,
    FOREIGN KEY(t_id) REFERENCES teachers(id) ON DELETE CASCADE
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
    status VARCHAR(20) DEFAULT 'in_progress',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    saved_state JSON DEFAULT NULL,
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
-- LEVEL 7: TRANSACTIONS & SYSTEM FEEDBACK
-- ==========================================

CREATE TABLE payments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    invoice_link VARCHAR(200) NOT NULL,
    amount DECIMAL(6,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    c_id INT NOT NULL,
    s_id INT NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY(c_id) REFERENCES classes_courses(id) ON DELETE CASCADE,
    FOREIGN KEY(s_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    user_id INT NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE certificates (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    link VARCHAR(200) NOT NULL,
    s_id INT NOT NULL,
    c_id INT NOT NULL,
    FOREIGN KEY(s_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(c_id) REFERENCES classes_courses(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500) NOT NULL,
    rating DECIMAL(2,1) NOT NULL DEFAULT 5.0, 
    c_id INT NOT NULL,
    s_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(s_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(c_id) REFERENCES classes_courses(id) ON DELETE CASCADE
);

-- ==========================================
-- LEVEL 8: PROGRESSION & ADMIN MANAGEMENT
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
-- LEVEL 9: MESSAGING & REAL-TIME COMMUNICATIONS
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

CREATE TABLE teacher_payouts (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    month_year VARCHAR(7) NOT NULL, /* Format: YYYY-MM */
    gross_earnings DECIMAL(10,2) DEFAULT 0.00,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    adjustment DECIMAL(10,2) DEFAULT 0.00,
    net_payable DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending',
    paid_at DATETIME NULL,
    UNIQUE KEY unique_month_teacher (teacher_id, month_year),
    FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- ==========================================
-- LEVEL 10: AUTO-CRON CLEANUP ROUTINES
-- ==========================================

DELIMITER $$
CREATE EVENT IF NOT EXISTS purge_old_messages
ON SCHEDULE EVERY 1 DAY
DO
  BEGIN
    DELETE FROM messages WHERE created_at < NOW() - INTERVAL 7 DAY;
  END$$
DELIMITER ;

-- ==========================================
-- LEVEL 11: SPEED OPTIMIZATION INDEXES
-- ==========================================

CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_teacher_verification ON teachers(verification_status);
CREATE INDEX idx_student_code ON students(user_code);
CREATE INDEX idx_teacher_code ON teachers(user_code);
CREATE INDEX idx_enrollment_lookup ON enrollments(s_id, c_id, status);

SET FOREIGN_KEY_CHECKS = 1; -- Safely re-enable relational checks before executing seeds

-- ==========================================
-- LEVEL 12: SYSTEM IMMUTABLE SEED DATA
-- ==========================================

INSERT INTO roles (role_name) VALUES ('admin'), ('teacher'), ('student');

INSERT INTO subjects (name) VALUES 
('Web Development'), ('Data Science'), ('UI/UX Design'), ('Mathematics'), ('Languages'), ('A/L Physics'), ('A/L Chemistry');

-- System Super Administrator Profile
INSERT INTO users(name, password, role_id, email, phone_number, address, dob, gender, status, join_date, picture) 
VALUES ('Super Admin', '$2b$10$ZemIIkWGaWhDaNFgHiXGyOEmzj2qoHzjNCoWNgNFBha9LfHhTPPJS', 1, 'admin.user@example.com', '077777777', 'Kandy', '2000-02-01', 'male', 'active', CURDATE(), 'default_admin.png');

INSERT INTO admins(user_id, admin_level) VALUES (1, 'super');

-- ==========================================
-- LEVEL 13: MOCK ACADEMIC & FINANCIAL SEEDS
-- ==========================================

-- Teacher Users
INSERT INTO users (name, password, role_id, email, phone_number, address, dob, gender, status, join_date) VALUES 
('teacher1', '$2b$10$ZemIIkWGaWhDaNFgHiXGyO', 2, 'teacher1@example.com', '0771111111', 'Jaffna', '1990-01-01', 'male', 'active', CURDATE()),
('teacher2', '$2b$10$ZemIIkWGaWhDaNFgHiXGyO', 2, 'teacher2@example.com', '0772222222', 'Colombo', '1992-05-15', 'female', 'active', CURDATE()),
('teacher3', '$2b$10$ZemIIkWGaWhDaNFgHiXGyO', 2, 'teacher3@example.com', '0773333333', 'Kandy', '1988-11-20', 'male', 'active', CURDATE());

-- Teacher Identity Links
INSERT INTO teachers (user_id, user_code, highest_qualification, university, experience_years, verification_status) VALUES 
(2, 'TCH001', 'BSc in Computer Science', 'University of Jaffna', 5, 'approved'),
(3, 'TCH002', 'MSc in Data Science', 'University of Colombo', 7, 'approved'),
(4, 'TCH003', 'PhD in Mathematics', 'University of Peradeniya', 10, 'approved');

-- Mock Live Courses
INSERT INTO classes_courses (name, title, type, t_id, status, is_published) VALUES
('Full-Stack Web Development', 'Mastering MERN', 'course', 1, 'active', 1),
('Advanced Data Science', 'Machine Learning Essentials', 'course', 2, 'active', 1);

-- Verified Instructor Financial Payout History
INSERT INTO teacher_payouts (teacher_id, month_year, gross_earnings, platform_fee, adjustment, net_payable, status, paid_at) VALUES 
(1, '2026-06', 850.00, 85.00, 0.00, 765.00, 'pending', NULL),
(2, '2026-05', 1200.00, 120.00, 0.00, 1080.00, 'paid', '2026-05-31 10:00:00'),
(2, '2026-06', 1500.00, 150.00, 50.00, 1400.00, 'pending', NULL),
(3, '2026-06', 300.00, 30.00, -10.00, 260.00, 'pending', NULL);

ALTER TABLE notifications ADD COLUMN is_read BOOLEAN;

ALTER TABLE classes_courses ADD COLUMN grade VARCHAR(50) DEFAULT NULL AFTER type;

ALTER TABLE reviews ADD UNIQUE INDEX unique_student_class (s_id, c_id);

ALTER TABLE classes_courses ADD COLUMN final_summary TEXT DEFAULT NULL;
ALTER TABLE reviews ADD COLUMN survey_responses TEXT DEFAULT NULL;

ALTER TABLE reviews ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

