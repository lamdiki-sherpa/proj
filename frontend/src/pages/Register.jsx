import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'user',
    experience: '',
    portfolio: '',
    designs: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((f) => ({ ...f, designs: Array.from(e.target.files) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('email', form.email.trim());
      formData.append('password', form.password.trim());
      formData.append('role', form.role.trim());

      if (form.role === 'designer') {
        formData.append('experience', form.experience.trim());
        formData.append('portfolio', form.portfolio.trim());
        form.designs.forEach((file) => {
          formData.append('designs', file);
        });
      }

      const res = await axios.post('http://localhost:5000/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow bg-white">
      <h2 className="text-2xl mb-6 font-bold">Register</h2>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      {success && <p className="mb-4 text-green-600">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          value={form.password}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="user">User</option>
          <option value="designer">Designer</option>
        </select>

        {form.role === 'designer' && (
          <>
            <input
              type="text"
              name="experience"
              placeholder="Experience (e.g. 5 years in graphic design)"
              required
              value={form.experience}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="url"
              name="portfolio"
              placeholder="Portfolio URL"
              required
              value={form.portfolio}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <label className="block mt-2 mb-1 font-semibold">
              Upload at least 2 designs (images or PDFs)
            </label>
            <input
              type="file"
              name="designs"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              required
              onChange={handleFileChange}
              className="w-full"
            />
          </>
        )}

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Register
        </button>
      </form>

      <p className="mt-4 text-center">
        Already have an account?{' '}
        <button
          onClick={() => navigate('/login')}
          className="text-blue-600 underline hover:text-blue-800"
          type="button"
        >
          Login here
        </button>
      </p>
    </div>
  );
}
