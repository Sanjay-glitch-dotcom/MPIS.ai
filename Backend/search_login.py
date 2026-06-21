import os

search_dir = r"E:\Sanjay\4-1\Mini-Project\Mini-Project(2)\MPIS\Frontend\src"
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'login(' in content or 'state.login' in content:
                    print(f"Found in: {filepath}")
