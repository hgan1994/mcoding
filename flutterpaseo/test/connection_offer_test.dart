import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/models/host_connection.dart';
import 'package:paseo/src/utils/connection_offer.dart';

void main() {
  test('parses relay v2 offers', () {
    const url =
        'https://relay.example.com/#offer=eyJ2IjoyLCJzZXJ2ZXJJZCI6InNydi0xIiwiZGFlbW9uUHVibGljS2V5QjY0Ijoia2V5LTEiLCJyZWxheSI6eyJlbmRwb2ludCI6IjEyNy4wLjAuMTo4Nzg3In19';

    final offer = parseOfferFromUrl(url);

    expect(offer.serverId, 'srv-1');
    expect(offer.preferredConnectionId, 'relay:127.0.0.1:8787');
    expect(offer.connections.single, isA<RelayHostConnection>());
  });

  test('parses LAN v3 offers with direct and relay connections', () {
    const url =
        'https://relay.example.com/#offer=eyJ2IjozLCJzZXJ2ZXJJZCI6InNydi0xIiwibGFiZWwiOiJtYWMtbWluaSIsInByZWZlcnJlZENvbm5lY3Rpb25JZCI6ImRpcmVjdDoxMjcuMC4wLjE6Njc2NyIsImNvbm5lY3Rpb25zIjpbeyJpZCI6ImRpcmVjdDoxMjcuMC4wLjE6Njc2NyIsInR5cGUiOiJkaXJlY3RUY3AiLCJlbmRwb2ludCI6IjEyNy4wLjAuMTo2NzY3In0seyJpZCI6InJlbGF5OjEyNy4wLjAuMTo4Nzg3IiwidHlwZSI6InJlbGF5IiwicmVsYXlFbmRwb2ludCI6IjEyNy4wLjAuMTo4Nzg3IiwiZGFlbW9uUHVibGljS2V5QjY0Ijoia2V5LTEifV19';

    final offer = parseOfferFromUrl(url);

    expect(offer.serverId, 'srv-1');
    expect(offer.label, 'mac-mini');
    expect(
      offer.connections.whereType<DirectTcpHostConnection>().single.endpoint,
      '127.0.0.1:6767',
    );
    expect(offer.hasRelayConnection, isTrue);
    expect(offer.preferredConnectionId, 'direct:127.0.0.1:6767');
  });
}
