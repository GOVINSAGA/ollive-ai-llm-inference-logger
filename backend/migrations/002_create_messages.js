/**
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('conversation_id').notNullable()
      .references('id').inTable('conversations').onDelete('CASCADE');
    table.enu('role', ['user', 'assistant', 'system']).notNullable();
    table.text('content').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index(['conversation_id', 'created_at'], 'idx_messages_conversation');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('messages');
};
