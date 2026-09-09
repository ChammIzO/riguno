import contextlib
import io
import os
import pathlib
import sys
import unittest
from unittest.mock import patch
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'tools/pricing'))
from identifiers import IdentifierIndex
from collect import main

class Identifiers(unittest.TestCase):
    def setUp(self):
        self.index = IdentifierIndex()
        self.known = {'one', 'two'}
        self.record = {'opendb_id': 'one', 'metadata': {'manufacturer': 'Example'}, 'identifiers': {
            'identifiers': [{'type': 'ean', 'value': '0735858550383'}, {'type': 'mpn', 'value': 'Part-1'}],
            'retailer_listings': [{'source': 'amazon', 'channel': 'fr', 'source_product_id': 'B012345678'}]}}
        self.index.add(self.record, self.known)

    def test_gtin_padding(self):
        self.assertEqual(self.index.resolve({'ean': '735858550383'}, {'merchant': 'ldlc'}, self.known), 'one')

    def test_asin_marketplace_scope(self):
        self.assertEqual(self.index.resolve({'asin': 'B012345678'}, {'merchant': 'amazon', 'country': 'fr'}, self.known), 'one')
        with self.assertRaises(ValueError):
            self.index.resolve({'asin': 'B012345678'}, {'merchant': 'amazon', 'country': 'de'}, self.known)

    def test_mpn_requires_brand(self):
        self.assertEqual(self.index.resolve({'mpn': 'PART-1', 'brand': 'example'}, {'merchant': 'ldlc'}, self.known), 'one')
        with self.assertRaises(ValueError):
            self.index.resolve({'mpn': 'Part-1'}, {'merchant': 'ldlc'}, self.known)

    def test_ambiguous_identifier_is_rejected(self):
        self.index.add({**self.record, 'opendb_id': 'two'}, self.known)
        with self.assertRaises(ValueError):
            self.index.resolve({'ean': '0735858550383'}, {'merchant': 'ldlc'}, self.known)

    def test_empty_github_secrets_are_not_errors(self):
        for value in ['', '   ', '[]']:
            with patch.dict(os.environ, {'RIGUNO_FEEDS': value}), contextlib.redirect_stdout(io.StringIO()) as out:
                main()
                self.assertIn('No merchant feed configured', out.getvalue())

    def test_invalid_config_fails_without_printing_contents(self):
        with patch.dict(os.environ, {'RIGUNO_FEEDS': 'SECRET_INVALID_JSON'}), contextlib.redirect_stderr(io.StringIO()) as out:
            with self.assertRaises(SystemExit):
                main()
            self.assertNotIn('SECRET_INVALID_JSON', out.getvalue())

if __name__ == '__main__':
    unittest.main()
