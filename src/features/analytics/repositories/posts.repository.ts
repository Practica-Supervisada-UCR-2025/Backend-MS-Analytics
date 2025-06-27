// src/repositories/posts.repository.ts
import { QueryResult } from 'pg';
import client from '../../../config/database'; // Ajusta la ruta a tu cliente de base de datos

// Extiende la interfaz para incluir más detalles del post
export interface PostDetail {
  id: string; // post_id
  userId: string; // user_id
  content: string | null; // contenido del post
  createdAt: string; // created_at del post (lo convertiremos a string)
  updatedAt: string | null; // updated_at
  fileUrl: string | null;
  fileSize: number | null;
  mediaType: number | null;
  isActive: boolean;
  isEdited: boolean;
  status: number;
  commentCount: number; // Cantidad de comentarios para este post en el período
}

export interface PostInteraction {
  // Ahora la interfaz TopPostMetric usará PostDetail directamente
}

export const getTopInteractedPostsMetrics = async (
  range: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string,
  limit: number
): Promise<{ date: string, posts: PostDetail[] }[]> => { // <-- Cambia el tipo de retorno aquí
  let dateTrunc = 'day';
  let interval = '1 day';
  let format = 'YYYY-MM-DD';

  switch (range) {
    case 'weekly':
      dateTrunc = 'week';
      interval = '1 week';
      format = 'IYYY-"W"IW'; // ISO week format: 2025-W19
      break;
    case 'monthly':
      dateTrunc = 'month';
      interval = '1 month';
      format = 'YYYY-MM';
      break;
  }

  const query = `
    WITH dates AS (
      SELECT generate_series(
        date_trunc($1, $2::timestamptz),
        date_trunc($1, $3::timestamptz),
        $5::interval
      ) AS period_start_date
    ),
    post_comments_per_period AS (
      SELECT
        p.id AS post_id,
        p.user_id,
        p.content,
        p.created_at AS post_created_at, -- Renombrar para evitar conflicto con c.created_at
        p.updated_at,
        p.file_url,
        p.file_size,
        p.media_type,
        p.is_active,
        p.is_edited,
        p.status,
        date_trunc($1, c.created_at) AS period_date,
        COUNT(c.id) AS comment_count
      FROM posts p
      JOIN comments c ON p.id = c.post_id
      WHERE c.created_at >= $2::timestamptz AND c.created_at <= ($3::timestamptz + interval '1 day')
      GROUP BY
        p.id, p.user_id, p.content, p.created_at, p.updated_at,
        p.file_url, p.file_size, p.media_type, p.is_active, p.is_edited, p.status,
        date_trunc($1, c.created_at)
    ),
    ranked_posts_per_period AS (
      SELECT
        pc.*, -- Selecciona todas las columnas de post_comments_per_period
        ROW_NUMBER() OVER (PARTITION BY pc.period_date ORDER BY pc.comment_count DESC, pc.post_id) as rn
      FROM post_comments_per_period pc
    )
    SELECT
      TO_CHAR(d.period_start_date, $4) AS date,
      (
        SELECT json_agg(
          json_build_object(
            'id', rp.post_id,
            'userId', rp.user_id,
            'content', rp.content,
            'createdAt', TO_CHAR(rp.post_created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), -- Formato ISO
            'updatedAt', TO_CHAR(rp.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), -- Formato ISO
            'fileUrl', rp.file_url,
            'fileSize', rp.file_size,
            'mediaType', rp.media_type,
            'isActive', rp.is_active,
            'isEdited', rp.is_edited,
            'status', rp.status,
            'commentCount', rp.comment_count
          ) ORDER BY rp.comment_count DESC
        )
        FROM ranked_posts_per_period rp
        WHERE rp.period_date = d.period_start_date AND rp.rn <= $6
      ) AS posts
    FROM dates d
    ORDER BY d.period_start_date;
  `;

  const result: QueryResult = await client.query(query, [
    dateTrunc,
    startDate,
    endDate,
    format,
    interval,
    limit,
  ]);

  // Mapeo a la interfaz PostDetail, asegurando tipos correctos
  return result.rows.map((row) => ({
    date: row.date,
    posts: row.posts
      ? row.posts.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          content: p.content,
          createdAt: p.createdAt, // Ya viene como string con formato ISO
          updatedAt: p.updatedAt,
          fileUrl: p.fileUrl,
          fileSize: p.fileSize,
          mediaType: p.mediaType,
          isActive: p.isActive,
          isEdited: p.isEdited,
          status: p.status,
          commentCount: parseInt(p.commentCount, 10), // Asegurarse de que sea número
        }))
      : [],
  }));
};