import os

# Change this to your client folder path
root_dir = "./client"  

old_url = "http://localhost:8080"
new_url = "process.env.VITE_API_URL"

# Walk through files
for subdir, dirs, files in os.walk(root_dir):
    # Skip node_modules, .git, dist
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist')]
    
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            file_path = os.path.join(subdir, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if old_url in content:
                content = content.replace(old_url, new_url)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated: {file_path}")

print("✅ Done replacing localhost URLs with VITE_API_URL")
