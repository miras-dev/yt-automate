# External skills in this folder

Copied unchanged from their original repositories. To update one, copy the same folder again from the same repo
(never from a fork) and update the commit below.

| folder | source | path in source | commit | licence |
|---|---|---|---|---|
| real-sfx/ | https://github.com/Clipwing/skills | skills/real-sfx | edbefcbc3474869e6cc1e8a7ca583b0efd0dab7e | no LICENSE file in the source repo; bundled uisfx sounds are CC0 (vendor/node_modules/uisfx/LICENSE-AUDIO) |
| openverse-sfx/ | https://github.com/Varnan-Tech/opendirectory | skills/openverse-sfx | caac7cda5621e289591e4e74b400e66ac72ad25b | MIT |
| earshot/ | https://github.com/Leonxlnx/earshot | skills/earshot | 4ac3d2ac2b151e1c23376f9ce7f3047a17050013 | MIT |
| real-sound/ | https://github.com/Leonxlnx/earshot | skills/real-sound | 4ac3d2ac2b151e1c23376f9ce7f3047a17050013 | MIT |

The earshot program itself (CLI + MCP server) is not vendored. Install it once per machine:

    uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot"
    earshot doctor --fetch        # downloads its two models, about 1.1 GB

`.mcp.json` in the repo root starts it as an MCP server (`earshot mcp`).
