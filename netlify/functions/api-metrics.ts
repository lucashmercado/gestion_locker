import type { Config } from '@netlify/functions'
import { getDb } from '../../db/index'
import { lockers, alquileres } from '../../db/schema'
import { eq, and, gte, sql, desc, lte } from 'drizzle-orm'
import { requireUser, requireGym, json, options } from './_helpers'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return options()

  const user  = requireUser(req)
  const gymId = await requireGym(user)
  const db = getDb()

  // Totales de lockers
  const [lockersStats] = await db
    .select({
      total:        sql<number>`count(*)`,
      libres:       sql<number>`count(*) filter (where estado = 'libre')`,
      ocupados:     sql<number>`count(*) filter (where estado = 'ocupado')`,
      vencidos:     sql<number>`count(*) filter (where estado = 'vencido')`,
      mantenimiento: sql<number>`count(*) filter (where estado = 'mantenimiento')`,
    })
    .from(lockers)
    .where(eq(lockers.gymId, gymId))

  // Ingresos del mes actual
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [ingresos] = await db
    .select({ total: sql<number>`coalesce(sum(monto_pagado), 0)` })
    .from(alquileres)
    .where(and(
      eq(alquileres.gymId, gymId),
      gte(alquileres.fechaCreacion, startOfMonth),
    ))

  // Últimos 12 meses de ingresos
  const doceRows = await db.execute(sql`
    SELECT
      to_char(date_trunc('month', fecha_creacion), 'Mon') as mes,
      EXTRACT(YEAR FROM fecha_creacion) as anio,
      COALESCE(SUM(monto_pagado), 0) as total
    FROM alquileres
    WHERE gym_id = ${gymId}
      AND fecha_creacion >= NOW() - INTERVAL '12 months'
    GROUP BY date_trunc('month', fecha_creacion)
    ORDER BY date_trunc('month', fecha_creacion)
  `)

  // Alquileres activos (últimos)
  const activos = await db.query.alquileres.findMany({
    where: and(eq(alquileres.gymId, gymId), eq(alquileres.estado, 'activo')),
    orderBy: desc(alquileres.fechaVencimiento),
    limit: 20,
    with: { locker: true, cliente: true },
  })

  // Próximos a vencer (7 días)
  const en7dias = new Date()
  en7dias.setDate(en7dias.getDate() + 7)

  const porVencer = await db.query.alquileres.findMany({
    where: and(
      eq(alquileres.gymId, gymId),
      eq(alquileres.estado, 'activo'),
      lte(alquileres.fechaVencimiento, en7dias),
    ),
    orderBy: alquileres.fechaVencimiento,
    with: { locker: true, cliente: true },
  })

  return json({
    lockers:     lockersStats,
    ingresosMes: Number(ingresos.total),
    ingresosPorMes: doceRows.rows,
    alquileresActivos: activos,
    porVencer,
  })
}

export const config: Config = { path: '/api/metrics' }
