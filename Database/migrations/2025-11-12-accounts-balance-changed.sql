ALTER TABLE account ADD COLUMN balance_changed_manually TEXT;

UPDATE account
SET balance_changed_manually = created_at
WHERE balance_changed_manually IS NULL;

DROP TRIGGER IF EXISTS trg_account_balance_changed_on_update;
CREATE TRIGGER trg_account_balance_changed_on_update
  AFTER UPDATE OF current_amount_cents ON account
  FOR EACH ROW
  WHEN NEW.current_amount_cents <> OLD.current_amount_cents
BEGIN
  UPDATE account
  SET balance_changed_manually = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS trg_account_balance_changed_on_insert;
CREATE TRIGGER trg_account_balance_changed_on_insert
  AFTER INSERT ON account
  FOR EACH ROW
  WHEN NEW.balance_changed_manually IS NULL
BEGIN
  UPDATE account
  SET balance_changed_manually = NEW.created_at
  WHERE id = NEW.id;
END;
