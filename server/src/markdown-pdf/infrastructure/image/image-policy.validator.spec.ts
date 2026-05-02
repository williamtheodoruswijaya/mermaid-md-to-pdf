import { isPrivateOrReservedIp } from './image-policy.validator';

describe('image policy validator', () => {
  it.each(['127.0.0.1', '10.0.0.5', '172.20.0.1', '192.168.1.1'])(
    'blocks private IPv4 address %s',
    (address) => {
      expect(isPrivateOrReservedIp(address)).toBe(true);
    },
  );

  it('allows public IPv4 addresses', () => {
    expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
  });
});
