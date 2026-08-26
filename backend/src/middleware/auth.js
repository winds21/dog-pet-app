// 认证中间件 - 验证 JWT Token
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dog-pet-app-secret-key';

export const authenticate = (req, res, next) => {
  try {
    // 从 Authorization 头获取 token
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录或登录已过期' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
};

export { JWT_SECRET };
