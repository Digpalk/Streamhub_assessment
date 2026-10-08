CREATE TABLE transactions (
    transaction_id INT PRIMARY KEY,
    sender_account VARCHAR(20),
    receiver_account VARCHAR(20),
    amount DECIMAL(12,2),
    transaction_time DATETIME
);

INSERT INTO transactions
(transaction_id, sender_account, receiver_account, amount, transaction_time)
VALUES
(1, 'A001', 'A002', 1000.00, '2026-10-01 10:00:00'),
(2, 'A002', 'A001', 950.00, '2026-10-01 18:00:00'),

(3, 'A003', 'A004', 2000.00, '2026-10-02 09:00:00'),
(4, 'A004', 'A003', 1900.00, '2026-10-03 10:00:00'),

(5, 'A005', 'A006', 5000.00, '2026-10-04 11:00:00'),
(6, 'A006', 'A005', 4400.00, '2026-10-04 16:00:00'),

(7, 'A007', 'A008', 3000.00, '2026-10-05 08:00:00'),
(8, 'A008', 'A007', 3200.00, '2026-10-05 19:00:00'),

(9, 'A009', 'A010', 1500.00, '2026-10-06 09:00:00'),
(10, 'A010', 'A009', 1450.00, '2026-10-06 20:00:00'),

(11, 'A011', 'A012', 4000.00, '2026-10-07 08:00:00'),
(12, 'A012', 'A011', 3400.00, '2026-10-07 12:00:00'),

(13, 'A013', 'A014', 2500.00, '2026-10-08 01:00:00'),
(14, 'A014', 'A013', 2300.00, '2026-10-09 00:00:00'),

(15, 'A015', 'A016', 1000.00, '2026-10-08 09:00:00'),
(16, 'A016', 'A015', 950.00, '2026-10-09 10:00:00'),

(17, 'A017', 'A018', 800.00, '2026-10-08 14:00:00'),
(18, 'A018', 'A017', 780.00, '2026-10-08 20:00:00'),

(19, 'A019', 'A020', 1200.00, '2026-10-08 15:00:00');

SELECT
    t1.transaction_id AS forward_transaction_id,
    t1.sender_account AS account_a,
    t1.receiver_account AS account_b,
    t1.amount AS amount_sent,
    t1.transaction_time AS forward_time,
    t2.transaction_id AS return_transaction_id,
    t2.amount AS amount_returned,
    t2.transaction_time AS return_time,
    ROUND(
        ABS(t2.amount - t1.amount) / t1.amount * 100,
        2
    ) AS amount_difference_percent
FROM transactions t1
JOIN transactions t2
    ON t1.sender_account = t2.receiver_account
    AND t1.receiver_account = t2.sender_account
    AND t2.transaction_time > t1.transaction_time
    AND t2.transaction_time <= DATE_ADD(t1.transaction_time, INTERVAL 24 HOUR)
    AND t2.amount BETWEEN t1.amount * 0.90 AND t1.amount * 1.10;


CREATE TABLE player_match_scores (
    match_id INT,
    match_date DATE,
    player_name VARCHAR(100),
    team VARCHAR(50),
    runs INT,
    PRIMARY KEY (match_id, player_name)
);

INSERT INTO player_match_scores
(match_id, match_date, player_name, team, runs)
VALUES
(1, '2024-04-01', 'Virat Kohli', 'RCB', 28),
(2, '2024-04-06', 'Virat Kohli', 'RCB', 42),
(3, '2024-04-09', 'Virat Kohli', 'RCB', 55),
(4, '2024-04-12', 'Virat Kohli', 'RCB', 38),
(5, '2024-04-15', 'Virat Kohli', 'RCB', 21),

(6, '2024-04-01', 'Ruturaj Gaikwad', 'CSK', 35),
(7, '2024-04-05', 'Ruturaj Gaikwad', 'CSK', 48),
(8, '2024-04-10', 'Ruturaj Gaikwad', 'CSK', 62),
(9, '2024-04-14', 'Ruturaj Gaikwad', 'CSK', 41),
(10, '2024-04-18', 'Ruturaj Gaikwad', 'CSK', 25),

(11, '2024-04-02', 'Sanju Samson', 'RR', 45),
(12, '2024-04-07', 'Sanju Samson', 'RR', 28),
(13, '2024-04-10', 'Sanju Samson', 'RR', 52),
(14, '2024-04-15', 'Sanju Samson', 'RR', 31),
(15, '2024-04-20', 'Sanju Samson', 'RR', 18),

(16, '2024-04-05', 'Travis Head', 'SRH', 20),
(17, '2024-04-10', 'Travis Head', 'SRH', 35),
(18, '2024-04-15', 'Travis Head', 'SRH', 89),
(19, '2024-04-19', 'Travis Head', 'SRH', 45),
(20, '2024-04-23', 'Travis Head', 'SRH', 12),

(21, '2024-04-03', 'Rinku Singh', 'KKR', 22),
(22, '2024-04-08', 'Rinku Singh', 'KKR', 34),
(23, '2024-04-12', 'Rinku Singh', 'KKR', 41),
(24, '2024-04-16', 'Rinku Singh', 'KKR', 33),
(25, '2024-04-21', 'Rinku Singh', 'KKR', 15);

WITH player_performance AS (
    SELECT
        player_name,
        match_date,
        runs,
        LAG(runs, 1) OVER (
            PARTITION BY player_name
            ORDER BY match_date
        ) AS previous_runs,
        LAG(runs, 2) OVER (
            PARTITION BY player_name
            ORDER BY match_date
        ) AS two_matches_ago_runs,
        LAG(match_date, 2) OVER (
            PARTITION BY player_name
            ORDER BY match_date
        ) AS streak_start_date
    FROM player_match_scores
),
three_match_streaks AS (
    SELECT
        player_name,
        streak_start_date
    FROM player_performance
    WHERE runs >= 30
      AND previous_runs >= 30
      AND two_matches_ago_runs >= 30
)
SELECT
    player_name,
    MIN(streak_start_date) AS streak_commenced
FROM three_match_streaks
GROUP BY player_name
ORDER BY streak_commenced;