'use client'

import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import { META_DATA } from '@/config/constants'
import { ChangeEvent, FormEvent, useState } from 'react'
import { Button, Form, FormCheck, FormControl, FormLabel } from 'react-bootstrap'
import { useAuth } from '../../hooks/use-auth'

const Forms = () => {
  const { register, loading, error } = useAuth()
  const [password, setPassword] = useState('')
  const [form, setForm] = useState({
    email: '',
    fullName: '',
  })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await register(form.fullName, form.email, password)
  }

  return (
    <Form onSubmit={handleSubmit}>
      <div className="mb-3">
        <FormLabel>
          Name <span className="text-danger">*</span>
        </FormLabel>
        <FormControl
          type="text"
          name="fullName"
          placeholder={META_DATA.username}
          required
          value={form.fullName}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <FormLabel>
          Email address <span className="text-danger">*</span>
        </FormLabel>
        <FormControl
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3" data-password="bar">
        <PasswordInputWithStrength
          id="password"
          label="Password"
          name="password"
          password={password}
          setPassword={setPassword}
          showIcon
          placeholder="********"
        />
      </div>

      <div className="mb-3">
        <FormCheck>
          <Form.Check.Input
            className="form-check-input-light fs-14"
            type="checkbox"
            id="termAndPolicy"
            required
          />
          <Form.Check.Label htmlFor="termAndPolicy">
            Agree the Terms &amp; Policy
          </Form.Check.Label>
        </FormCheck>
      </div>

      {error && <p className="text-danger">{error}</p>}

      <div className="d-grid">
        <Button
          variant="primary"
          type="submit"
          className="fw-semibold py-2"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </div>
    </Form>
  )
}

export default Forms
