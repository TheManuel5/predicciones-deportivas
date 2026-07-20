import os

with open('feature_engineering.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Change default fast_mode to False
content = content.replace('def create_sample_training_data(n_samples: Optional[int] = None, fast_mode: bool = True)', 'def create_sample_training_data(n_samples: Optional[int] = None, fast_mode: bool = False)')

with open('feature_engineering.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("feature_engineering.py patched.")
