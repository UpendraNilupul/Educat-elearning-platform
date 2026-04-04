DROP DATABASE IF EXISTS educat;
CREATE DATABASE educat;
USE educat;

-- ==========================================
-- LEVEL 1: CORE TABLES
-- ==========================================

CREATE TABLE roles (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
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
    picture VARCHAR(300),
    2fa_enabled BOOLEAN DEFAULT FALSE,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ==========================================
-- LEVEL 3: SPECIFIC USER PROFILES
-- ==========================================

CREATE TABLE teachers (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
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
    action_type VARCHAR(50) NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- LEVEL 4: COURSES & CONTENT
-- ==========================================

CREATE TABLE advertisements (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    t_id INT NOT NULL,
    ad_link VARCHAR(300),
    FOREIGN KEY(t_id) REFERENCES teachers(id)
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
    isVisible TINYINT(1) DEFAULT 1,
    c_id INT NOT NULL,
    FOREIGN KEY(c_id) REFERENCES classes_courses(id)
);

-- ==========================================
-- LEVEL 5: MODULE ASSETS & ASSESSMENTS
-- ==========================================

CREATE TABLE lessons (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    number DECIMAL(4,2) NOT NULL,
    title VARCHAR(150) DEFAULT '',
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
    m_id INT NOT NULL,
    l_id INT,
    FOREIGN KEY(m_id) REFERENCES modules(id),
    FOREIGN KEY(l_id) REFERENCES lessons(id) ON DELETE CASCADE
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

-- ==========================================
-- LEVEL 6: CONNECTIONS & TRANSACTIONS
-- ==========================================

CREATE TABLE answers (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    answer VARCHAR(400) NOT NULL,
    correct BOOLEAN DEFAULT FALSE,
    q_id INT NOT NULL,
    FOREIGN KEY(q_id) REFERENCES question_bank(id)
);

CREATE TABLE quiz_questions (
    qz_id INT NOT NULL,
    q_id INT NOT NULL,
    PRIMARY KEY (qz_id, q_id),
    FOREIGN KEY(qz_id) REFERENCES quizes(id),
    FOREIGN KEY(q_id) REFERENCES question_bank(id)
);

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
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE certificates (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    link VARCHAR(200) NOT NULL,
    s_id INT NOT NULL,
    c_id INT NOT NULL,
    FOREIGN KEY(s_id) REFERENCES students(id),
    FOREIGN KEY(c_id) REFERENCES classes_courses(id)
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
-- LEVEL 7: STUDENT PROGRESS & TRACKING
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

-- ==========================================
-- LEVEL 8: ASSIGNMENTS (FROM DB1 - RESTORED)
-- ==========================================

CREATE TABLE assignments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    m_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    attachment_url VARCHAR(300),
    deadline DATETIME NOT NULL,
    max_marks DECIMAL(5,2) DEFAULT 100.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(m_id) REFERENCES modules(id) ON DELETE CASCADE
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

-- ==========================================
-- LEVEL 9: SUBJECTS & TIMETABLES
-- ==========================================

CREATE TABLE subjects (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE teacher_subjects (
    t_id INT NOT NULL,
    sub_id INT NOT NULL,
    PRIMARY KEY (t_id, sub_id),
    FOREIGN KEY (t_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (sub_id) REFERENCES subjects(id) ON DELETE CASCADE
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
-- SEED DATA
-- ==========================================

INSERT INTO roles (role_name) VALUES ('admin'), ('teacher'), ('student');

INSERT INTO subjects (name) VALUES 
('Web Development'), ('Data Science'), ('UI/UX Design'), ('Mathematics'), ('Languages');