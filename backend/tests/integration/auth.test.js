const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mock des dépendances
jest.mock('../../models/BaseModel');
jest.mock('../../utils/logger');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Routes Integration Tests', () => {
  let app;
  let mockUser;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    mockUser = testHelpers.createTestUser({
      id: 1,
      email: 'test@example.com',
      mot_de_passe: '$2b$10$hashedpassword'
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock user lookup
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(mockUser);
      
      // Mock password verification
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      
      // Mock JWT generation
      jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          mot_de_passe: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('mock-jwt-token');
      expect(response.body.data.user.email).toBe('test@example.com');
      
      // Vérifier que le mot de passe n'est pas retourné
      expect(response.body.data.user.mot_de_passe).toBeUndefined();
    });

    it('should reject login with invalid email', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          mot_de_passe: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email ou mot de passe incorrect');
    });

    it('should reject login with invalid password', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(mockUser);
      
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          mot_de_passe: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email ou mot de passe incorrect');
    });

    it('should validate login request data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          // mot_de_passe manquant
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject login for inactive user', async () => {
      const inactiveUser = { ...mockUser, actif: false };
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(inactiveUser);
      
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          mot_de_passe: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Compte désactivé');
    });

    it('should set remember me token if requested', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(mockUser);
      BaseModel.prototype.update = jest.fn().mockResolvedValue(mockUser);
      
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn()
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          mot_de_passe: 'password123',
          se_souvenir: true
        });

      expect(response.status).toBe(200);
      expect(response.body.data.refresh_token).toBe('refresh-token');
      expect(jwt.sign).toHaveBeenCalledTimes(2); // access + refresh tokens
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const token = testHelpers.createTestToken();
      
      // Mock JWT verification
      jwt.verify = jest.fn().mockReturnValue({ userId: 1 });
      
      // Mock user update (clear refresh token)
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.update = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Déconnexion réussie');
    });

    it('should require authentication for logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid token', async () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const token = testHelpers.createTestToken(mockUser.id);
      
      jwt.verify = jest.fn().mockReturnValue({ 
        userId: mockUser.id, 
        role: mockUser.role 
      });
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockUser.id);
      expect(response.body.data.email).toBe(mockUser.email);
      expect(response.body.data.mot_de_passe).toBeUndefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle user not found', async () => {
      const token = testHelpers.createTestToken(999);
      
      jwt.verify = jest.fn().mockReturnValue({ userId: 999 });
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      
      jwt.verify = jest.fn().mockReturnValue({ 
        userId: mockUser.id,
        type: 'refresh'
      });
      
      jwt.sign = jest.fn().mockReturnValue('new-access-token');
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        refresh_token: refreshToken
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('new-access-token');
    });

    it('should reject invalid refresh token', async () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject if refresh token does not match user', async () => {
      jwt.verify = jest.fn().mockReturnValue({ 
        userId: mockUser.id,
        type: 'refresh'
      });
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        refresh_token: 'different-token'
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'provided-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email for valid user', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(mockUser);
      BaseModel.prototype.update = jest.fn().mockResolvedValue(true);
      
      // Mock email service
      const emailService = require('../../services/emailService');
      emailService.sendPasswordReset = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Email envoyé');
      expect(emailService.sendPasswordReset).toHaveBeenCalled();
    });

    it('should not reveal if email does not exist', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      // Même réponse pour éviter l'énumération d'emails
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Email envoyé');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const resetToken = 'valid-reset-token';
      const hashedToken = 'hashed-reset-token';
      
      bcrypt.hash = jest.fn()
        .mockResolvedValueOnce(hashedToken) // Hash the token for comparison
        .mockResolvedValueOnce('$2b$10$newhashed'); // Hash the new password
      
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      
      const userWithResetToken = {
        ...mockUser,
        reset_token: hashedToken,
        reset_token_expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      };
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(userWithResetToken);
      BaseModel.prototype.update = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          nouveau_mot_de_passe: 'NewPassword123!',
          confirmer_nouveau_mot_de_passe: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Mot de passe réinitialisé');
    });

    it('should reject expired reset token', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        reset_token: 'hashed-token',
        reset_token_expires: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      };
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(userWithExpiredToken);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'expired-token',
          nouveau_mot_de_passe: 'NewPassword123!',
          confirmer_nouveau_mot_de_passe: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token expiré');
    });

    it('should validate password confirmation', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-token',
          nouveau_mot_de_passe: 'NewPassword123!',
          confirmer_nouveau_mot_de_passe: 'DifferentPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});

afterAll(async () => {
  if (global.server && typeof global.server.close === 'function') {
    await new Promise((resolve) => global.server.close(resolve));
  }
});
