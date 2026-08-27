"""Checks that the approved module boundaries are importable."""

from importlib import import_module

MODULES = (
    "handler",
    "scoring",
    "matching",
    "scenario",
    "negotiate",
    "pact",
    "llm_client",
    "fallback",
)


def test_all_design_modules_are_importable() -> None:
    for module_name in MODULES:
        assert import_module(module_name) is not None
