import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';



const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log(data);

            //sessions
            if (response.ok) {
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userRole', data.userRole);

                if (data.userRole === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            }
            else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('Something went wrong connecting to the server.');
        }
    };

    return (
        <div className="login-form-container pt-32 pb-12">

            {/* If you want padding INSIDE the white form box itself, add p-8 here */}
            <form onSubmit={handleLogin} id="login-form" className="p-8">
                <h3>login now</h3>

                <input
                    type="email"
                    placeholder="your email"
                    className="box"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="your password"
                    className="box"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <input type="submit" value="login" className="btn" />

                <input type="checkbox" id="remember-me" />
                <label htmlFor="remember-me">remember me</label>

                <p>forget password? <a href="#">click here</a></p>

                <p>don't have an account? <a href="/signup" id="register-link">create one</a></p>
            </form>
        </div>
    );
};

export default Login;