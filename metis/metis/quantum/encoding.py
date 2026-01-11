"""
QUBO encoding functions imported from quantum-sampler.

This module imports from quantum-sampler/utils/encoding.py to maintain a single
source of truth. The quantum-sampler directory is added to sys.path to enable the import.
"""
import sys
from pathlib import Path
import importlib.util

# Calculate paths
_metis_dir = Path(__file__).parent.parent.parent
_repo_root = _metis_dir.parent
_quantum_sampler_utils = _repo_root / "quantum-sampler" / "utils"

# Load the encoding module directly from the file path
_encoding_file = _repo_root / "quantum-sampler" / "utils" / "encoding.py"
if not _encoding_file.exists():
    raise ImportError(f"Could not find quantum-sampler/utils/encoding.py at {_encoding_file}")

_spec = importlib.util.spec_from_file_location("quantum_sampler_utils_encoding", _encoding_file)
_encoding_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_encoding_module)

# Import the functions
encode_search_space_to_qubo = _encoding_module.encode_search_space_to_qubo
encode_config_to_qubits = _encoding_module.encode_config_to_qubits
qubits_to_config = _encoding_module.qubits_to_config

__all__ = [
    'encode_search_space_to_qubo',
    'encode_config_to_qubits',
    'qubits_to_config',
]
