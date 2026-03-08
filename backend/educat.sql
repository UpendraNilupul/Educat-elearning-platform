create database educat;
use educat;
create table users(id int not null auto_increment primary key, name varchar(150) not null, password varchar(200) not null, role varchar(20) not null, email varchar(100) not null, phone_number varchar(10) not null,
 address varchar(150) not null, dob date not null, gender varchar(6) not null, status varchar(20) default 'active', join_date date not null, picture varchar(300), 2fa_enabled boolean default false);
 create table advertisements(id int not null auto_increment primary key, t_id int not null, ad_link varchar(300), foreign key(t_id) references users(id));
 create table classes_courses(id int not null auto_increment primary key, name varchar(100) not null, title varchar(100) not null,type varchar(20) not null, t_id int not null,
 status varchar(20) default 'not_active', is_published boolean default false, foreign key(t_id) references users(id));
 create table promo_codes(id int not null auto_increment primary key, code varchar(50) not null, c_id int not null, status varchar(20) default 'active', discount_percent decimal(5,3) not null, expire_date date not null, foreign key(c_id) references classes_courses(id));
 create table question_bank(id int not null auto_increment primary key, type varchar(20) not null, marks decimal(4,2) not null, question varchar(1000) not null, c_id int not null,
 t_id int not null, foreign key(c_id) references classes_courses(id), foreign key(t_id) references users(id));
 create table answers(id int not null auto_increment primary key, answer varchar(400) not null, correct boolean default false, q_id int not null, foreign key(q_id) references question_bank(id));
 create table payments(id int not null auto_increment primary key, invoice_link varchar(200) not null, amount decimal(6,2) not null, status varchar(20) not null, c_id int not null, s_id int not null, foreign key(c_id) references classes_courses(id), foreign key(s_id) references users(id));
 create table notifications(id int not null auto_increment primary key, title varchar(100) not null, description varchar(500) not null, s_id int not null, foreign key(s_id) references users(id));
 create table certificates(id int not null auto_increment primary key, link varchar(200) not null, s_id int not null, c_id int not null, foreign key(s_id) references users(id), foreign key(c_id) references classes_courses(id));
 create table reviews(id int not null auto_increment primary key, title varchar(200) not null, description varchar(500) not null, c_id int not null, s_id int not null, foreign key(s_id) references users(id), foreign key(c_id) references classes_courses(id));
 create table modules(id int not null auto_increment primary key, number int not null, title varchar(100) not null, status varchar(20) default 'active', c_id int not null, foreign key(c_id) references classes_courses(id));
 create table lessons(id int not null auto_increment primary key, number decimal(4,2) not null, type varchar(20) not null, link varchar(300) not null, m_id int not null, foreign key(m_id) references modules(id));
 create table resources(id int not null auto_increment primary key, name varchar(100) not null, link varchar(300) not null, number int not null , m_id int not null, foreign key(m_id) references modules(id));
 create table quizes(id int not null auto_increment primary key, number int not null, time_limit time not null, is_peer_reviewed boolean not null default false, m_id int not null, foreign key(m_id) references modules(id));
 create table quiz_questions( qz_id int not null, q_id int not null, primary key (qz_id, q_id), foreign key(qz_id) references quizes(id), foreign key(q_id) references question_bank(id));