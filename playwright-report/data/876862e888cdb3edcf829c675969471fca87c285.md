# Page snapshot

```yaml
- main "Cupid HUD Prototype v3" [ref=e2]:
  - region "Scene background" [ref=e3]:
    - img "Afterparty Apartment" [ref=e4]
  - region "Mid layer" [ref=e5]:
    - img
    - generic "Scene hotspots":
      - button "Phone"
  - img
  - navigation "HUD buttons":
    - button "Stats" [ref=e7] [cursor=pointer]:
      - generic [ref=e9]: Stats
    - button "Log" [ref=e10] [cursor=pointer]:
      - generic [ref=e12]: Log
    - button "Map" [ref=e13] [cursor=pointer]:
      - generic [ref=e15]: Map
    - button "Inv" [ref=e16] [cursor=pointer]:
      - generic [ref=e18]: Inv
    - button "Missions" [ref=e19] [cursor=pointer]:
      - generic [ref=e20]: Missions
    - button "Edit" [ref=e21] [cursor=pointer]:
      - generic [ref=e23]: Edit
    - button "Settings" [ref=e24] [cursor=pointer]:
      - generic [ref=e25]: Settings
  - region "Panels"
  - region "Modal"
```