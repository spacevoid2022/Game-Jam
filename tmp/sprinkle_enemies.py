import os
import random

def sprinkle_enemies(filename, probability=0.3):
    if not os.path.exists(filename):
        print(f"File not found: {filename}")
        return
    
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    rows = [line.strip().split(',') for line in lines if line.strip()]
    if not rows:
        return

    num_rows = len(rows)
    num_cols = len(rows[0])

    added = 0
    for y in range(1, num_rows):
        for x in range(num_cols):
            # Only place on solid tiles (0-8)
            if y < num_rows and x < len(rows[y]):
                tile_below = rows[y][x]
                try:
                    tile_id = int(tile_below)
                    if 0 <= tile_id <= 8:
                        # Check tile above
                        if rows[y-1][x] == '-1':
                            if random.random() < probability:
                                rows[y-1][x] = '16'
                                added += 1
                except (ValueError, IndexError):
                    continue
    
    with open(filename, 'w') as f:
        for row in rows:
            f.write(','.join(row) + '\n')
    
    print(f"Added {added} enemies to {filename}")

# Targeted paths from Game Jam root
sprinkle_enemies('phaser_game/public/Assets/level1_data.csv', 0.25)
sprinkle_enemies('phaser_game/public/Assets/level2_data.csv', 0.3)
sprinkle_enemies('phaser_game/public/Assets/level3_data.csv', 0.35)
