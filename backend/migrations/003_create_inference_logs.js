/**
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('inference_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('conversation_id').references('id').inTable('conversations').onDelete('SET NULL');
    table.uuid('message_id').references('id').inTable('messages').onDelete('SET NULL');

    // Provider metadata
    table.string('model', 100).notNullable();
    table.string('provider', 50).notNullable();

    // Performance metrics
    table.integer('latency_ms');
    table.integer('prompt_tokens');
    table.integer('completion_tokens');
    table.integer('total_tokens');
    table.integer('time_to_first_token_ms');

    // Request metadata
    table.enu('status', ['success', 'error', 'cancelled']).notNullable();
    table.text('error_message');
    table.timestamp('request_timestamp', { useTz: true }).notNullable();
    table.timestamp('response_timestamp', { useTz: true });

    // Previews (PII-redacted)
    table.text('input_preview');
    table.text('output_preview');

    // Raw metadata (JSONB for extensibility)
    table.jsonb('raw_metadata');

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    // Indexes for dashboard queries
    table.index('conversation_id', 'idx_logs_conversation');
    table.index('request_timestamp', 'idx_logs_timestamp');
    table.index('status', 'idx_logs_status');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inference_logs');
};
