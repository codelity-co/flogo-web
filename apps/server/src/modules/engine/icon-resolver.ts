import * as nodePath from 'path';
import resolvePath from 'resolve-path';
import * as isSvg from 'is-svg';
import { isBinaryFile } from 'isbinaryfile';

export async function ensureValidIcon<T extends { display?: { icon?: string } }>({
  contribSchemaPath,
  contribSchemaRef,
  contribSchema,
}: {
  contribSchemaPath: string;
  contribSchemaRef: string;
  contribSchema: T;
}): Promise<T> {
  if (!contribSchema?.display?.icon) {
    return contribSchema;
  }

  const iconPath = contribSchema.display.icon;
  const resolvedIconPath = await validateAndResolveIconPath({
    iconPath,
    schemaPath: contribSchemaPath,
    schemaRef: contribSchemaRef,
  });
  if (resolvedIconPath) {
    const { icon, ...display } = contribSchema.display;
    contribSchema = {
      ...contribSchema,
      iconPath: resolvedIconPath,
    };
  } else {
    const { icon, ...display } = contribSchema.display;
    contribSchema = {
      ...contribSchema,
      display,
    };
  }
  return contribSchema;
}

async function validateAndResolveIconPath({
  schemaPath,
  schemaRef,
  iconPath,
}): Promise<null | string> {
  if (nodePath.extname(iconPath) !== '.svg') {
    console.warn(
      `warning: could not load "${iconPath}" as icon for "${schemaRef}". Only .svg files are supported.
      )}".`
    );
    return null;
  }

  const contribFolder = nodePath.dirname(schemaPath);
  let resolvedIconPath = null;
  try {
    resolvedIconPath = resolvePath(contribFolder, iconPath);
  } catch (e) {
    console.warn(
      `warning: could not load icon for "${schemaRef}". File path ${iconPath} is not inside contribution directory "${nodePath.basename(
        contribFolder
      )}".`
    );
    return null;
  }

  let isPlaintext;
  try {
    isPlaintext = !(await isBinaryFile(resolvedIconPath));
  } catch (e) {
    console.warn(
      `warning: could not read icon "${iconPath}" in filesystem for "${schemaRef} (${nodePath.basename(
        contribFolder
      )})". Wrong permissions or file doesn't exist.`
    );
    return null;
  }

  if (!isPlaintext) {
    console.warn(
      `warning: won't load icon "${iconPath}" for "${schemaRef} (${nodePath.basename(
        contribFolder
      )})". "${iconPath}" seems to be a binary file, only .svg files are supported.`
    );
  }

  // todo use isSvg()?
  // caveats: we have to load the whole file to determine is it is valid svg
  // is it really necessary? or should we just assume it is valid svg and assume contributors will verify the icon works in the UI
  // also is there really a reason for preventing people from using pngs?

  resolvedIconPath = nodePath.relative(process.env.GOPATH, resolvedIconPath);
  return resolvedIconPath;
}
