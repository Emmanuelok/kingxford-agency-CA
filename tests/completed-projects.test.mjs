import assert from "node:assert/strict";
import test from "node:test";
import { completedProjects } from "../lib/completed-projects.ts";

test("the public showcase omits St. John's Methodist Church and retains the other published projects", () => {
  assert.deepEqual(completedProjects.map((project) => project.slug), [
    "elkings-developers",
    "elkings-studio",
    "trios-services",
    "grandmaster",
    "abetifi-bosumpra",
    "velaire-interiors",
  ]);
  assert.ok(completedProjects.every((project) => project.published));
  assert.doesNotMatch(JSON.stringify(completedProjects), /st-johns-methodist|stjohnsmethodist|Methodist Church/);
});
