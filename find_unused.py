with open("src/pages/PipelinePage.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "STAGES" in line or "DialogHeader" in line or "DialogTitle" in line:
        print(f"Line {i+1}: {line.strip()}")
