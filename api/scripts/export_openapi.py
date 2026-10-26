import json
import sys
from pathlib import Path

# Add api directory to sys.path
api_dir = Path(__file__).resolve().parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from app.main import app


def export_openapi_schema() -> Path:
    """Generate OpenAPI schema dictionary and dump formatted JSON to docs/openapi.json."""
    openapi_data = app.openapi()
    repo_root = Path(__file__).resolve().parent.parent.parent
    output_path = repo_root / "docs" / "openapi.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_data, f, indent=2)

    print(f"OpenAPI schema successfully exported to: {output_path}")
    return output_path


if __name__ == "__main__":
    export_openapi_schema()
