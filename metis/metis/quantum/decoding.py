"""
QUBO decoding functions imported from quantum-sampler.

This module imports from quantum-sampler/utils/decoding.py to maintain a single
source of truth. The quantum-sampler directory is added to sys.path to enable the import.
"""
import sys
from pathlib import Path
import importlib.util

# Calculate paths
_metis_dir = Path(__file__).parent.parent.parent
_repo_root = _metis_dir.parent

# Load the decoding module directly from the file path
_decoding_file = _repo_root / "quantum-sampler" / "utils" / "decoding.py"
if not _decoding_file.exists():
    raise ImportError(f"Could not find quantum-sampler/utils/decoding.py at {_decoding_file}")

_spec = importlib.util.spec_from_file_location("quantum_sampler_utils_decoding", _decoding_file)
_decoding_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_decoding_module)

# Import the function
decode_samples = _decoding_module.decode_samples

__all__ = ['decode_samples']
