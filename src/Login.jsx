import React, { useState } from 'react';
// Import your CSS file here (make sure the path is correct relative to this file)
// import './css/singin.css'; 

const Login = () => {
    // 1. Set up state to hold the email and password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 2. Create the submit handler (replacing your old script tag)
    const handleLogin = async (e) => {
        e.preventDefault(); // Stop page refresh

        try {
            // Send data to your Node/Express backend
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Success: ' + data.message);
                // Later, you can add code here to redirect to the dashboard
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('Something went wrong connecting to the server.');
        }
    };

    // 3. Render the JSX (your converted HTML)
    return (
        <div className="login-form-container">
            <form onSubmit={handleLogin} id="login-form">
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
                
                {/* Notice the href is updated for React routing if you use it later */}
                <p>don't have an account? <a href="/signup" id="register-link">create one</a></p>
            </form>
        </div>
    );
};

export default Login;