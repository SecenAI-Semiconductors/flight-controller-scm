import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { ADMIN_ROLES } from '../App';
import FormField from '../components/FormField';
import Button from '../components/Button';
import '../styles/components/login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user: loggedInUser } = await login(form.email, form.password);
      if (ADMIN_ROLES.includes(loggedInUser.role)) {
        // Return admin to the page they were trying to reach, or /admin
        const from = location.state?.from?.pathname ?? '/admin';
        navigate(from, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__logo">
            <img src="/images/secenai-logo-icon.png" alt="SECENAI" className="login-card__logo-img" />
          </div>
          <h1 className="login-card__title">FC-SCM</h1>
          <p className="login-card__subtitle">Sign in to your account</p>
        </div>

        <form className="login-card__form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-card__error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="admin@secenai.com"
            required
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          <div className="login-card__submit">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
