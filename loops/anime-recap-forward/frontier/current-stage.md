# Current Stage: 1 (Content Ingestion)

## Spec Sections
- Implementation: Section 3.1
- Validation: Section 9.1 (see spec for validate_stage1())

## Test Results (updated by loop — iteration 5)
```
============================= test session starts ==============================
platform linux -- Python 3.10.12, pytest-7.4.2, pluggy-1.3.0 -- /usr/bin/python3
cachedir: .pytest_cache
hypothesis profile 'default' -> database=DirectoryBasedExampleDatabase('/home/clsandoval/cs/monorepo/automations/anime-recap-engine/.hypothesis/examples')
rootdir: /home/clsandoval/cs/monorepo/automations/anime-recap-engine
configfile: pyproject.toml
plugins: mock-3.15.1, hypothesis-6.84.2, testmon-2.0.12, anyio-4.12.0, xdist-3.3.1, dash-2.14.0
collecting ... collected 43 items

tests/test_stage1.py::TestEpisodeDiscovery::test_finds_all_episodes_sorted PASSED [  2%]
tests/test_stage1.py::TestEpisodeDiscovery::test_rejects_fewer_than_12_episodes PASSED [  4%]
tests/test_stage1.py::TestEpisodeDiscovery::test_ignores_non_mp4_files PASSED [  6%]
tests/test_stage1.py::TestEpisodeDiscovery::test_sorts_lexicographically PASSED [  9%]
tests/test_stage1.py::TestFPSDetection::test_detects_23976_fps PASSED    [ 11%]
tests/test_stage1.py::TestFPSDetection::test_detects_30fps PASSED        [ 13%]
tests/test_stage1.py::TestFPSDetection::test_detects_integer_fps PASSED  [ 16%]
tests/test_stage1.py::TestFPSDetection::test_ffprobe_failure_raises PASSED [ 18%]
tests/test_stage1.py::TestFPSDetection::test_ffprobe_called_with_correct_args PASSED [ 20%]
tests/test_stage1.py::TestSceneDetection::test_scene_detect_uses_threshold_27 PASSED [ 23%]
tests/test_stage1.py::TestSceneDetection::test_scene_detect_uses_detect_content PASSED [ 25%]
tests/test_stage1.py::TestSceneDetection::test_parse_scene_csv PASSED    [ 27%]
tests/test_stage1.py::TestSceneDetection::test_parse_scene_csv_includes_frame_count PASSED [ 30%]
tests/test_stage1.py::TestTranscription::test_probes_for_subtitle_streams PASSED [ 32%]
tests/test_stage1.py::TestTranscription::test_falls_back_to_whisper_when_no_subs PASSED [ 34%]
tests/test_stage1.py::TestTranscription::test_whisper_uses_source_language PASSED [ 37%]
tests/test_stage1.py::TestTranscription::test_prefers_source_language_subtitle_track PASSED [ 39%]
tests/test_stage1.py::TestTranscription::test_prefers_srt_over_ass_when_same_language PASSED [ 41%]
tests/test_stage1.py::TestSubtitleValidation::test_valid_subtitles_pass PASSED [ 44%]
tests/test_stage1.py::TestSubtitleValidation::test_too_few_cues_fails PASSED [ 46%]
tests/test_stage1.py::TestSubtitleValidation::test_low_coverage_fails PASSED [ 48%]
tests/test_stage1.py::TestSubtitleValidation::test_short_avg_cue_length_fails PASSED [ 51%]
tests/test_stage1.py::TestWhisperValidation::test_valid_whisper_output_passes PASSED [ 53%]
tests/test_stage1.py::TestWhisperValidation::test_too_few_segments_fails PASSED [ 55%]
tests/test_stage1.py::TestWhisperValidation::test_long_segment_fails PASSED [ 58%]
tests/test_stage1.py::TestAudioSeparation::test_demucs_called_with_two_stems PASSED [ 60%]
tests/test_stage1.py::TestAudioSeparation::test_demucs_output_paths PASSED [ 62%]
tests/test_stage1.py::TestOPEDDetection::test_op_detected_in_first_3_minutes PASSED [ 65%]
tests/test_stage1.py::TestOPEDDetection::test_ed_detected_in_last_3_minutes PASSED [ 67%]
tests/test_stage1.py::TestManifestAssembly::test_manifest_has_all_episodes PASSED [ 69%]
tests/test_stage1.py::TestManifestAssembly::test_manifest_includes_fps PASSED [ 72%]
tests/test_stage1.py::TestManifestAssembly::test_manifest_marks_op_ed_scenes_as_skip PASSED [ 74%]
tests/test_stage1.py::TestValidateStage1::test_valid_manifest_passes PASSED [ 76%]
tests/test_stage1.py::TestValidateStage1::test_missing_fps_is_hard_failure PASSED [ 79%]
tests/test_stage1.py::TestValidateStage1::test_too_few_scenes_is_hard_failure PASSED [ 81%]
tests/test_stage1.py::TestValidateStage1::test_too_few_transcript_segments_is_hard_failure PASSED [ 83%]
tests/test_stage1.py::TestValidateStage1::test_missing_audio_stems_is_hard_failure PASSED [ 86%]
tests/test_stage1.py::TestValidateStage1::test_missing_op_on_episode_gt1_is_soft_warning PASSED [ 88%]
tests/test_stage1.py::TestValidateStage1::test_missing_op_on_episode_1_is_ok PASSED [ 90%]
tests/test_stage1.py::TestValidateStage1::test_fewer_than_12_episodes_is_hard_failure PASSED [ 93%]
tests/test_stage1.py::TestIngestPipeline::test_ingest_creates_manifest PASSED [ 95%]
tests/test_stage1.py::TestIngestPipeline::test_ingest_processes_each_episode PASSED [ 97%]
tests/test_stage1.py::TestIngestPipeline::test_ingest_writes_per_episode_outputs PASSED [100%]

============================== 43 passed in 0.47s ==============================
```

## Validation Results (updated by loop — iteration 5)
```
PASS: Work directory /home/clsandoval/cs/monorepo/automations/anime-recap-engine/test-work/ does not exist (run pipeline first)
```

## Work Log
(no iterations yet)
