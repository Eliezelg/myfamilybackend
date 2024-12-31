const { validateChild } = require('../../validators/childValidator');

describe('Child Validator', () => {
  it('should pass with valid child data', () => {
    const validData = {
      firstName: 'Alice',
      lastName: 'Doe',
      dateOfBirth: '2020-01-01',
      gender: 'F',
      photo: 'https://example.com/photo.jpg'
    };

    const { error } = validateChild(validData);
    expect(error).toBeUndefined();
  });

  it('should pass without optional fields', () => {
    const validData = {
      firstName: 'Alice',
      lastName: 'Doe',
      dateOfBirth: '2020-01-01'
    };

    const { error } = validateChild(validData);
    expect(error).toBeUndefined();
  });

  it('should fail with missing required fields', () => {
    const invalidData = {
      firstName: 'Alice'
    };

    const { error } = validateChild(invalidData);
    expect(error).toBeDefined();
    expect(error.details.some(d => d.path.includes('lastName') || d.path.includes('dateOfBirth'))).toBeTruthy();
  });

  it('should fail with invalid date format', () => {
    const invalidData = {
      firstName: 'Alice',
      lastName: 'Doe',
      dateOfBirth: 'invalid-date'
    };

    const { error } = validateChild(invalidData);
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('dateOfBirth');
  });

  it('should fail with future date of birth', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const invalidData = {
      firstName: 'Alice',
      lastName: 'Doe',
      dateOfBirth: futureDate.toISOString().split('T')[0]
    };

    const { error } = validateChild(invalidData);
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('dateOfBirth');
  });

  it('should fail with invalid gender', () => {
    const invalidData = {
      firstName: 'Alice',
      lastName: 'Doe',
      dateOfBirth: '2020-01-01',
      gender: 'X'
    };

    const { error } = validateChild(invalidData);
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('gender');
  });

  it('should fail with invalid photo URL', () => {
    const invalidData = {
      firstName: 'Alice',
      lastName: 'Doe',
      dateOfBirth: '2020-01-01',
      photo: 'invalid-url'
    };

    const { error } = validateChild(invalidData);
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('photo');
  });

  it('should fail with too long names', () => {
    const longName = 'A'.repeat(51);
    const invalidData = {
      firstName: longName,
      lastName: 'Doe',
      dateOfBirth: '2020-01-01'
    };

    const { error } = validateChild(invalidData);
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('firstName');
  });
});
