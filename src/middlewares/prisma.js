const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware pour ajouter l'instance Prisma à l'objet req
const prismaMiddleware = (req, res, next) => {
  req.prisma = prisma;
  next();
};

module.exports = prismaMiddleware;
