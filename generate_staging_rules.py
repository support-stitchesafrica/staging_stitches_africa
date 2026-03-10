import re
from pathlib import Path

INPUT_FILE = "firestore.rules"
OUTPUT_FILE = "firestore.with-staging.rules"

# Matches top-level rule lines like:
# match /agents/{agentId} {
# match /users/{userId} {
# match /product_analytics/{productId} {
TOP_LEVEL_MATCH_RE = re.compile(
    r'(^[ \t]*match\s+/([A-Za-z0-9_]+)([^\n]*)\{)',
    re.MULTILINE
)

# Real top-level names to skip
# Add anything here only if you NEVER want a staging_ copy for it
SKIP_TOP_LEVEL_COLLECTIONS = {
    "databases",
}

def already_staging(name: str) -> bool:
    return name.startswith("staging_")

def should_skip_collection(name: str) -> bool:
    if not name:
        return True

    # skip anything already staging
    if already_staging(name):
        return True

    # skip explicit excluded names
    if name in SKIP_TOP_LEVEL_COLLECTIONS:
        return True

    return False

def extract_match_blocks(content: str):
    """
    Extract top-level match blocks.
    Returns list of (start, end, collection_name, block_text)
    """
    results = []

    for m in TOP_LEVEL_MATCH_RE.finditer(content):
        collection = m.group(2)

        if should_skip_collection(collection):
            continue

        start = m.start()

        brace_start = content.find("{", m.end() - 1)
        if brace_start == -1:
            continue

        depth = 0
        end = None
        for i in range(brace_start, len(content)):
            if content[i] == "{":
                depth += 1
            elif content[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break

        if end is None:
            continue

        block_text = content[start:end]
        results.append((start, end, collection, block_text))

    return results

def make_staging_block(block_text: str, collection: str) -> str:
    # Replace only the first match line:
    # match /users/{userId} {  -> match /staging_users/{userId} {
    return re.sub(
        rf'(^[ \t]*match\s+)/{re.escape(collection)}(?=/)',
        rf'\1/staging_{collection}',
        block_text,
        count=1,
        flags=re.MULTILINE
    )

def insert_staging_blocks(content: str) -> str:
    blocks = extract_match_blocks(content)
    if not blocks:
        return content

    # Insert staging blocks before the DEFAULT RULE comment if present
    default_rule_match = re.search(
        r'^[ \t]*//[^\n]*DEFAULT RULE.*?$',
        content,
        re.MULTILINE | re.IGNORECASE
    )

    if default_rule_match:
        insert_pos = default_rule_match.start()
    else:
        # fallback: before final closing braces
        insert_pos = content.rfind("}")

    staging_blocks = []
    seen = set()

    for _, _, collection, block_text in blocks:
        if collection in seen:
            continue
        seen.add(collection)

        staging_block = make_staging_block(block_text, collection)
        staging_blocks.append(
            f"\n    // ==============================\n"
            f"    // STAGING COPY: /staging_{collection}\n"
            f"    // ==============================\n"
            f"{staging_block}\n"
        )

    return content[:insert_pos] + "".join(staging_blocks) + "\n" + content[insert_pos:]

def main():
    input_path = Path(INPUT_FILE)
    if not input_path.exists():
        raise FileNotFoundError(f"Could not find {INPUT_FILE}")

    content = input_path.read_text(encoding="utf-8")
    new_content = insert_staging_blocks(content)
    Path(OUTPUT_FILE).write_text(new_content, encoding="utf-8")
    print(f"Generated: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()