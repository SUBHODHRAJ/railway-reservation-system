ALTER TABLE seat_availability
ADD INDEX idx_seat_availability_expiry (status, hold_expires_at);
