import {Config} from '@remotion/cli/config';

// Keep x264 from creating a large thread pool on this high-core-count host.
Config.overrideFfmpegCommand(({args}) => {
  const input = args.indexOf('-i');
  const limited = input < 0 ? args : [...args.slice(0, input), '-threads', '2', ...args.slice(input)];
  const output = args.at(-1)!;
  return [...limited.slice(0, -1), '-threads', '2', '-filter_threads', '1', output];
});
