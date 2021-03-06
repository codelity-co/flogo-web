import { Injectable, Sanitizer, SecurityContext } from '@angular/core';

@Injectable()
export class SanitizeService {
  constructor(private sanitizer: Sanitizer) {}

  sanitizeHTMLInput(input: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, input);
  }
}
