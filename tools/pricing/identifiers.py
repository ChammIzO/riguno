"""Resolve merchant records to OpenDB IDs using exact identifiers, never product names."""
from collections import defaultdict
import json
import tarfile


def gtin(value):
    text = str(value or '').strip()
    if text.isdigit() and len(text) in (8, 12, 13, 14):
        return text.zfill(14)
    return None


def identity(kind, value, brand=''):
    if kind in ('ean', 'upc', 'gtin'):
        code = gtin(value)
        return ('gtin', code) if code else None
    if kind == 'mpn' and value and brand:
        return ('mpn', str(brand).strip().casefold(), str(value).strip().casefold())
    return None


class IdentifierIndex:
    def __init__(self):
        self.entries = defaultdict(set)

    def add(self, record, known):
        pid = record.get('opendb_id')
        if pid not in known:
            return
        brand = record.get('metadata', {}).get('manufacturer', '')
        identifiers = record.get('identifiers', {})
        for item in identifiers.get('identifiers', []):
            key = identity(item.get('type'), item.get('value'), brand)
            if key:
                self.entries[key].add(pid)
        for listing in identifiers.get('retailer_listings', []):
            key = ('retailer', listing.get('source'), listing.get('channel'),
                   str(listing.get('source_product_id', '')).strip())
            if key[-1]:
                self.entries[key].add(pid)

    @classmethod
    def from_archive(cls, path, known):
        index = cls()
        with tarfile.open(path, 'r:gz') as archive:
            for member in archive:
                if not member.isfile() or '/open-db/' not in member.name or not member.name.endswith('.json'):
                    continue
                if member.size > 1000000:
                    continue
                stream = archive.extractfile(member)
                if stream:
                    index.add(json.load(stream), known)
        return index

    def resolve(self, row, config, known):
        def field(name):
            return row.get(config.get('fields', {}).get(name, name))
        pid = str(field('part_id') or '').strip()
        if pid:
            if pid not in known:
                raise ValueError('Unknown OpenDB ID')
            return pid
        keys = []
        for kind in ('ean', 'upc', 'gtin'):
            key = identity(kind, field(kind))
            if key:
                keys.append(key)
        key = identity('mpn', field('mpn'), field('brand'))
        if key:
            keys.append(key)
        merchant = config['merchant']
        country = str(field('country') or config.get('country', 'fr'))
        product_id = field('source_product_id') or (field('asin') if merchant == 'amazon' else None)
        if product_id:
            keys.append(('retailer', merchant, country, str(product_id).strip()))
        matched = [self.entries[key] for key in keys if self.entries.get(key)]
        if not matched:
            raise ValueError('No exact identifier match')
        candidates = set.intersection(*matched)
        if len(candidates) != 1:
            raise ValueError('Ambiguous or conflicting identifiers')
        return next(iter(candidates))
