// src/controllers/posts.controller.ts
import { NextFunction, Request, Response } from 'express';
import { topPostsQuerySchema, TopPostsQuery } from '../dto/posts.dto';
import { PostsService } from '../services/posts.service';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware'; // Ajusta la ruta a tu middleware

const postsService = new PostsService();

export const getTopInteractedPostsController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // RF24, RF25, RF26: Solo administradores
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Only administrators can view this metric.' });
    }

    // Validar los parámetros de la consulta usando el esquema Yup
    const queryParams: TopPostsQuery = await topPostsQuerySchema.validate(req.query, { abortEarly: false });

    // Llamar al servicio para obtener los datos
    const data = await postsService.getTopInteractedPosts(queryParams);

    // RNF3: Tiempo de respuesta (ya manejado implícitamente si la DB es rápida)
    // RNF18: La interfaz la maneja el frontend, aquí solo devolvemos los datos.

    res.status(200).json(data);
  } catch (err: any) {
    // Manejo de errores de validación de Yup
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation Error',
        details: err.errors,
      });
    }
    // Otros errores del servidor
    next(err); // Pasa el error al siguiente middleware de manejo de errores
  }
};