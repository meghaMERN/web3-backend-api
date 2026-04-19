import jwt from 'jsonwebtoken';

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token == null) return res.status(401);

        jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
            if (err) return res.status(403);
            req.user = user;
            next()
        })
    } catch (error) {
        res.status(400).json({ message: 'Error in authenticating user', error: error.message })
    }
};

export default authenticateToken;