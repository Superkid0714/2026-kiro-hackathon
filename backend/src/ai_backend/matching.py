from __future__ import annotations

from typing import Any

import networkx as nx


def compute_roommate_matching(
    students: list[dict[str, Any]],
    pair_scores: list[dict[str, Any]],
) -> dict[str, Any]:
    student_ids = sorted(student["student_id"] for student in students)
    if len(student_ids) % 2 != 0:
        return _error(
            "odd_student_count",
            "학생 수가 짝수가 아니어서 2인실 매칭을 진행할 수 없습니다.",
        )

    graph = nx.Graph()
    graph.add_nodes_from(student_ids)
    lookup: dict[tuple[str, str], dict[str, Any]] = {}

    for pair in pair_scores:
        if not pair["eligible"]:
            continue
        key = tuple(sorted((pair["student_a"], pair["student_b"])))
        lookup[key] = pair
        graph.add_edge(pair["student_a"], pair["student_b"], weight=pair["score"])

    raw_matching = nx.algorithms.matching.max_weight_matching(
        graph,
        maxcardinality=True,
        weight="weight",
    )
    if len(raw_matching) != len(student_ids) // 2:
        return _error(
            "matching_unavailable",
            "모든 학생을 2인 1조로 묶을 수 있는 유효 매칭이 없습니다.",
        )

    normalized_pairs: list[dict[str, Any]] = []
    covered: set[str] = set()
    normalized_raw = sorted(
        (tuple(sorted(pair)) for pair in raw_matching),
        key=lambda item: (item[0], item[1]),
    )
    for a, b in normalized_raw:
        if a in covered or b in covered:
            return _error("duplicate_assignment", "중복 배정이 감지되었습니다.")
        covered.update({a, b})
        normalized_pairs.append(lookup[(a, b)])

    if len(covered) != len(student_ids):
        return _error("incomplete_assignment", "일부 학생이 배정되지 않았습니다.")

    return {"status": "ok", "pairs": normalized_pairs, "errors": []}


def _error(code: str, message: str) -> dict[str, Any]:
    return {"status": "error", "pairs": [], "errors": [{"code": code, "message": message}]}
