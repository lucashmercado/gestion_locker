import { pgTable, uuid, text, timestamp, decimal, integer, index } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ─── Tablas ───────────────────────────────────────────────────

export const gyms = pgTable('gyms', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  nombre:        text('nombre').notNull(),
  direccion:     text('direccion'),
  telefono:      text('telefono'),
  ownerId:       text('owner_id').notNull().unique(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow(),
})

export const lockers = pgTable('lockers', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  gymId:         uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
  numero:        integer('numero').notNull(),
  estado:        text('estado').notNull().default('libre'),
  observaciones: text('observaciones'),
  fechaCreacion: timestamp('fecha_creacion').defaultNow(),
}, (t) => [index('lockers_gym_idx').on(t.gymId)])

export const clientes = pgTable('clientes', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  gymId:         uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
  nombre:        text('nombre').notNull(),
  telefono:      text('telefono'),
  email:         text('email'),
  fechaCreacion: timestamp('fecha_creacion').defaultNow(),
}, (t) => [index('clientes_gym_idx').on(t.gymId)])

export const alquileres = pgTable('alquileres', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  gymId:            uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
  clienteId:        uuid('cliente_id').references(() => clientes.id, { onDelete: 'set null' }),
  lockerId:         uuid('locker_id').notNull().references(() => lockers.id),
  fechaInicio:      timestamp('fecha_inicio').notNull(),
  fechaVencimiento: timestamp('fecha_vencimiento').notNull(),
  tipoAlquiler:     text('tipo_alquiler').notNull(),
  montoPagado:      decimal('monto_pagado', { precision: 10, scale: 2 }),
  metodoPago:       text('metodo_pago').notNull().default('efectivo'),
  estado:           text('estado').notNull().default('activo'),
  fechaCreacion:    timestamp('fecha_creacion').defaultNow(),
}, (t) => [
  index('alquileres_gym_idx').on(t.gymId),
  index('alquileres_locker_idx').on(t.lockerId),
])

// Tabla empleados — vincula un email con un gym.
// El admin registra el email del empleado; cuando ese email se loguea, obtiene rol 'empleado'.
export const empleados = pgTable('empleados', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  gymId:         uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
  email:         text('email').notNull(),
  nombre:        text('nombre'),
  fechaCreacion: timestamp('fecha_creacion').defaultNow(),
}, (t) => [index('empleados_gym_idx').on(t.gymId)])

// ─── Relaciones ───────────────────────────────────────────────

export const gymsRelations = relations(gyms, ({ many }) => ({
  lockers:    many(lockers),
  clientes:   many(clientes),
  alquileres: many(alquileres),
  empleados:  many(empleados),
}))

export const lockersRelations = relations(lockers, ({ one, many }) => ({
  gym:        one(gyms, { fields: [lockers.gymId],  references: [gyms.id] }),
  alquileres: many(alquileres),
}))

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  gym:        one(gyms, { fields: [clientes.gymId], references: [gyms.id] }),
  alquileres: many(alquileres),
}))

export const alquileresRelations = relations(alquileres, ({ one }) => ({
  gym:     one(gyms,     { fields: [alquileres.gymId],     references: [gyms.id] }),
  locker:  one(lockers,  { fields: [alquileres.lockerId],  references: [lockers.id] }),
  cliente: one(clientes, { fields: [alquileres.clienteId], references: [clientes.id] }),
}))

export const empleadosRelations = relations(empleados, ({ one }) => ({
  gym: one(gyms, { fields: [empleados.gymId], references: [gyms.id] }),
}))

// ─── Tipos inferidos ──────────────────────────────────────────

export type Gym         = typeof gyms.$inferSelect
export type Locker      = typeof lockers.$inferSelect
export type Cliente     = typeof clientes.$inferSelect
export type Alquiler    = typeof alquileres.$inferSelect
export type Empleado    = typeof empleados.$inferSelect
export type NewLocker   = typeof lockers.$inferInsert
export type NewCliente  = typeof clientes.$inferInsert
export type NewAlquiler = typeof alquileres.$inferInsert
export type NewEmpleado = typeof empleados.$inferInsert
