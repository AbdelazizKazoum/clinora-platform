'use client';
import Icon from '@/components/wrappers/Icon';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useState } from 'react';
import {
  Button,
  Form,
  FormCheck,
  FormControl,
  FormLabel,
} from 'react-bootstrap';
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput';
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel';
import { useAuth } from '../../hooks/use-auth';

const LoginForm = () => {
  const { login, loading, error } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(form.email, form.password);
  };

  return (
    <Form className="mt-4" onSubmit={handleSubmit}>
      <div className="mb-3">
        <FormLabel>
          Email address&nbsp;
          <span className="text-danger">*</span>
        </FormLabel>
        <div className="app-search">
          <FormControl
            type="email"
            id="userEmail"
            name="email"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={handleChange}
          />
          <Icon icon="mail" className="app-search-icon text-muted" />
        </div>
      </div>

      <div className="mb-3">
        <FormLabel>
          Password&nbsp;
          <span className="text-danger">*</span>
        </FormLabel>
        <div className="app-search">
          <FormControl
            type="password"
            id="userPassword"
            name="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={handleChange}
          />
          <Icon icon="lock-keyhole" className="app-search-icon text-muted" />
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <FormCheck>
          <FormCheckInput
            className="form-check-input-light fs-14"
            type="checkbox"
            defaultChecked
            id="rememberMe"
          />
          <FormCheckLabel>Keep me signed in</FormCheckLabel>
        </FormCheck>
        <Link
          href="/auth/split/reset-pass"
          className="text-decoration-underline link-offset-3 text-muted"
        >
          Forgot Password?
        </Link>
      </div>
      {error && <p className="text-danger">{error}</p>}
      <div className="d-grid">
        <Button
          variant="primary"
          type="submit"
          className="btn fw-bold py-2"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </div>
    </Form>
  );
};

export default LoginForm;
