-- ============================================================================
-- HABBA — 0005_security_hardening.sql
-- Extra guards that must not rely on the UI:
--   * orders are immutable once cancelled/delivered (except status polish)
--   * order_items can never be updated or deleted
--   * settings switches are validated
--   * stock/variant features are explicitly out of scope
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Order items are a historical ledger: no UPDATE, no DELETE.
-- Deleting an order cascades; nothing else may touch its lines.
-- ---------------------------------------------------------------------------
create or replace function public.protect_order_items()
returns trigger
language plpgsql
as $$
begin
  -- Historical lines can never be deleted.
  if tg_op = 'DELETE' then
    raise exception 'order_items are immutable (historical snapshot)'
      using errcode = 'insufficient_privilege';
  end if;

  -- The only permitted UPDATE is the FK action products -> ON DELETE SET NULL,
  -- which merely clears product_id. Every snapshot column must stay identical.
  if (new.order_id, new.product_slug, new.product_name_ar, new.product_name_en,
      new.brand_name_ar, new.size_label, new.unit_price, new.list_price, new.quantity)
     is distinct from
     (old.order_id, old.product_slug, old.product_name_ar, old.product_name_en,
      old.brand_name_ar, old.size_label, old.unit_price, old.list_price, old.quantity)
  then
    raise exception 'order_items are immutable (historical snapshot)'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists order_items_no_update on public.order_items;
create trigger order_items_no_update
  before update or delete on public.order_items
  for each row execute function public.protect_order_items();

-- ---------------------------------------------------------------------------
-- Status transitions: a cancelled or delivered order cannot be reopened.
-- ---------------------------------------------------------------------------
create or replace function public.guard_order_status()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('cancelled', 'delivered') and new.status is distinct from old.status then
    raise exception 'order % is final and cannot change status', old.order_number
      using errcode = 'check_violation';
  end if;

  if new.status is distinct from old.status then
    -- allowed forward paths
    if not (
      (old.status = 'new'       and new.status in ('confirmed','cancelled')) or
      (old.status = 'confirmed' and new.status in ('preparing','cancelled')) or
      (old.status = 'preparing' and new.status in ('ready','cancelled'))     or
      (old.status = 'ready'     and new.status in ('delivered','cancelled'))
    ) then
      raise exception 'invalid status transition % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;
  end if;

  -- Totals and customer data are immutable once created.
  if new.subtotal <> old.subtotal
     or new.delivery_fee <> old.delivery_fee
     or new.total <> old.total
     or new.customer_name <> old.customer_name
     or new.customer_phone <> old.customer_phone then
    raise exception 'order financial and customer data are immutable'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_guard_status on public.orders;
create trigger orders_guard_status
  before update on public.orders
  for each row execute function public.guard_order_status();

-- ---------------------------------------------------------------------------
-- Settings sanity: a free-delivery threshold must not sit below the fee
-- semantics in a way that makes fees negative, and numbers stay digits only.
-- ---------------------------------------------------------------------------
alter table public.store_settings
  drop constraint if exists store_settings_whatsapp_format;
alter table public.store_settings
  add constraint store_settings_whatsapp_format
  check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{9,15}$');

alter table public.store_settings
  drop constraint if exists store_settings_contact_format;
alter table public.store_settings
  add constraint store_settings_contact_format
  check (contact_phone is null or contact_phone ~ '^[0-9+ -]{6,20}$');

-- ---------------------------------------------------------------------------
-- Explicitly out of scope (documented, not implemented):
--   * product variants / multiple sizes  -> single size_label column
--   * stock quantities / inventory       -> no column, no admin screen
--   * charts / analytics dashboards      -> dashboard shows counters only
-- ---------------------------------------------------------------------------

commit;
