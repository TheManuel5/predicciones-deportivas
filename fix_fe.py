
with open('feature_engineering.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix compute_team_form and compute_goals_features
content = content.replace("((df['home_team'] == team_name) | (df['away_team'] == team_name)        ",
                          "((df['home_team'] == team_name) | (df['away_team'] == team_name))")

# Fix compute_h2h_features
content = content.replace("((df['home_team'] == home_team) & (df['away_team'] == away_team) |  ",
                          "(((df['home_team'] == home_team) & (df['away_team'] == away_team)) | ")

with open('feature_engineering.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")

