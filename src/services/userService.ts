import { prisma } from './prismaClient';
import bcrypt from 'bcryptjs';

export const createUser = async (email: string, password: string, nombre: string) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await prisma.usuario.create({
        data: {
            email,
            password: hashedPassword,
            nombre
        }
    });
};

export const findUserByEmail = async (email: string) => {
    return await prisma.usuario.findUnique({
        where: { email }
    });
};

export const findUserById = async (id: number) => {
    return await prisma.usuario.findUnique({
        where: { id }
    });
};

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};
